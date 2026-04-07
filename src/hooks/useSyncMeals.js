import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, loadFirebaseAuth } from "../firebase";
import {
  DEFAULT_CALORIE_GOAL,
  DEFAULT_PREP_DAYS,
  INITIAL_MEALS,
  LOCAL_STORAGE_AUTH_ACTIVE_KEY,
  LOCAL_STORAGE_MEALS_KEY,
  LOCAL_STORAGE_SETTINGS_KEY,
  FOOD_GROUPS,
} from "../data/constants";

function normalizePositiveNumber(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function normalizePositiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function normalizeMealPlan(value) {
  return value && typeof value === "object" ? value : INITIAL_MEALS;
}

function normalizePlanName(value) {
  if (typeof value !== "string") {
    return "Meal plan";
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Meal plan";
}

function toDateOrNull(value) {
  if (value?.toDate && typeof value.toDate === "function") {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return null;
}

function calculatePlanCalories(meals) {
  return Math.round(
    Object.values(meals).reduce((mealAcc, mealFoods) => {
      return (
        mealAcc +
        FOOD_GROUPS.reduce((foodAcc, food) => {
          const grams = mealFoods?.[food.id] || 0;
          return foodAcc + food.kCal * (grams / 100);
        }, 0)
      );
    }, 0),
  );
}

function comparePlansByRecent(a, b) {
  const aTime = a.updatedAt?.getTime?.() ?? 0;
  const bTime = b.updatedAt?.getTime?.() ?? 0;
  return bTime - aTime;
}

function loadMealsFromLocalStorage() {
  try {
    const storedMeals = localStorage.getItem(LOCAL_STORAGE_MEALS_KEY);
    if (!storedMeals) {
      return INITIAL_MEALS;
    }

    const parsedMeals = JSON.parse(storedMeals);
    return parsedMeals && typeof parsedMeals === "object"
      ? parsedMeals
      : INITIAL_MEALS;
  } catch (error) {
    console.error("Failed to load meals from localStorage:", error);
    return INITIAL_MEALS;
  }
}

function loadSettingsFromLocalStorage() {
  try {
    const storedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (!storedSettings) {
      return {
        calorieGoal: DEFAULT_CALORIE_GOAL,
        prepDays: DEFAULT_PREP_DAYS,
      };
    }

    const parsedSettings = JSON.parse(storedSettings);
    return {
      calorieGoal: normalizePositiveNumber(
        parsedSettings?.calorieGoal,
        DEFAULT_CALORIE_GOAL,
      ),
      prepDays: normalizePositiveInteger(
        parsedSettings?.prepDays,
        DEFAULT_PREP_DAYS,
      ),
    };
  } catch (error) {
    console.error("Failed to load planner settings from localStorage:", error);
    return {
      calorieGoal: DEFAULT_CALORIE_GOAL,
      prepDays: DEFAULT_PREP_DAYS,
    };
  }
}

function shouldRestorePreviousAuthSession() {
  try {
    return localStorage.getItem(LOCAL_STORAGE_AUTH_ACTIVE_KEY) === "true";
  } catch (error) {
    console.error(
      "Failed to read auth restore marker from localStorage:",
      error,
    );
    return false;
  }
}

function setAuthRestoreMarker(isActive) {
  try {
    if (isActive) {
      localStorage.setItem(LOCAL_STORAGE_AUTH_ACTIVE_KEY, "true");
      return;
    }

    localStorage.removeItem(LOCAL_STORAGE_AUTH_ACTIVE_KEY);
  } catch (error) {
    console.error(
      "Failed to update auth restore marker in localStorage:",
      error,
    );
  }
}

export function useSyncMeals() {
  const [user, setUser] = useState(null);
  const [meals, setMeals] = useState(loadMealsFromLocalStorage);
  const [settings, setSettings] = useState(loadSettingsFromLocalStorage);
  const [mealPlans, setMealPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [isPlansLoading, setIsPlansLoading] = useState(false);
  const [isInitialPlanSetupRequired, setIsInitialPlanSetupRequired] =
    useState(false);
  const authRuntimeRef = useRef(null);
  const authUnsubscribeRef = useRef(null);

  const persistMealsToLocalStorage = (nextMeals) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MEALS_KEY, JSON.stringify(nextMeals));
    } catch (error) {
      console.error("Failed to save meals to localStorage:", error);
    }
  };

  const persistSettingsToLocalStorage = (nextSettings) => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_SETTINGS_KEY,
        JSON.stringify(nextSettings),
      );
    } catch (error) {
      console.error("Failed to save planner settings to localStorage:", error);
    }
  };

  const ensureAuthReady = async () => {
    if (authRuntimeRef.current) {
      return authRuntimeRef.current;
    }

    const authDependencies = await loadFirebaseAuth();
    if (!authDependencies) {
      return null;
    }

    authRuntimeRef.current = authDependencies;

    if (!authUnsubscribeRef.current) {
      authUnsubscribeRef.current = authDependencies.onAuthStateChanged(
        authDependencies.auth,
        (firebaseUser) => {
          setUser(firebaseUser || null);
          setAuthRestoreMarker(Boolean(firebaseUser));

          if (!firebaseUser) {
            setMealPlans([]);
            setActivePlanId(null);
            setIsInitialPlanSetupRequired(false);
            setIsPlansLoading(false);
          }
        },
      );
    }

    return authDependencies;
  };

  useEffect(() => {
    return () => {
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldRestorePreviousAuthSession()) {
      return;
    }

    void ensureAuthReady();
  }, []);

  useEffect(() => {
    const syncMealPlansAfterLogin = async () => {
      if (!db || !user?.uid) {
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const mealPlansRef = collection(db, "users", user.uid, "mealPlans");

      try {
        setIsPlansLoading(true);
        const [userSnapshot, plansSnapshot] = await Promise.all([
          getDoc(userDocRef),
          getDocs(query(mealPlansRef, orderBy("updatedAt", "desc"))),
        ]);

        const userData = userSnapshot.exists() ? userSnapshot.data() : null;
        const plans = plansSnapshot.docs
          .map((planDoc) => {
            const data = planDoc.data();
            return {
              id: planDoc.id,
              name: normalizePlanName(data?.name),
              meals: normalizeMealPlan(data?.meals),
              calorieGoal: normalizePositiveNumber(
                data?.calorieGoal,
                DEFAULT_CALORIE_GOAL,
              ),
              prepDays: normalizePositiveInteger(
                data?.prepDays,
                DEFAULT_PREP_DAYS,
              ),
              totalKcal: normalizePositiveNumber(
                data?.totalKcal,
                calculatePlanCalories(normalizeMealPlan(data?.meals)),
              ),
              createdAt: toDateOrNull(data?.createdAt),
              updatedAt: toDateOrNull(data?.updatedAt),
            };
          })
          .sort(comparePlansByRecent);

        setMealPlans(plans);

        if (plans.length === 0) {
          setActivePlanId(null);
          setIsInitialPlanSetupRequired(true);
          return;
        }

        setIsInitialPlanSetupRequired(false);

        const preferredPlanId =
          typeof userData?.activePlanId === "string"
            ? userData.activePlanId
            : null;
        const selectedPlan =
          plans.find((plan) => plan.id === preferredPlanId) || plans[0];

        setActivePlanId(selectedPlan.id);
        setMeals(selectedPlan.meals);
        persistMealsToLocalStorage(selectedPlan.meals);

        const selectedSettings = {
          calorieGoal: selectedPlan.calorieGoal,
          prepDays: selectedPlan.prepDays,
        };

        setSettings(selectedSettings);
        persistSettingsToLocalStorage(selectedSettings);

        if (preferredPlanId !== selectedPlan.id) {
          await setDoc(
            userDocRef,
            {
              activePlanId: selectedPlan.id,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        }
      } catch (error) {
        console.error(
          "Failed to sync meal plans during login handshake:",
          error,
        );
      } finally {
        setIsPlansLoading(false);
      }
    };

    void syncMealPlansAfterLogin();
  }, [user]);

  const updateMeals = (updater) => {
    setMeals((prev) => {
      const nextMeals = typeof updater === "function" ? updater(prev) : updater;

      persistMealsToLocalStorage(nextMeals);

      if (db && user?.uid && activePlanId) {
        const planDocRef = doc(
          db,
          "users",
          user.uid,
          "mealPlans",
          activePlanId,
        );
        const nextTotalKcal = calculatePlanCalories(nextMeals);

        void updateDoc(planDocRef, {
          meals: nextMeals,
          totalKcal: nextTotalKcal,
          updatedAt: serverTimestamp(),
        }).catch((error) => {
          console.error("Failed to sync active meal plan to Firestore:", error);
        });

        setMealPlans((prevPlans) =>
          prevPlans
            .map((plan) =>
              plan.id === activePlanId
                ? {
                    ...plan,
                    meals: nextMeals,
                    totalKcal: nextTotalKcal,
                    updatedAt: new Date(),
                  }
                : plan,
            )
            .sort(comparePlansByRecent),
        );
      }

      return nextMeals;
    });
  };

  const updateSettingField = (field, value, normalizer) => {
    setSettings((prev) => {
      const nextValue = normalizer(value, prev[field]);
      const nextSettings = {
        ...prev,
        [field]: nextValue,
      };

      persistSettingsToLocalStorage(nextSettings);

      if (db && user?.uid && activePlanId) {
        const planDocRef = doc(
          db,
          "users",
          user.uid,
          "mealPlans",
          activePlanId,
        );
        void updateDoc(planDocRef, {
          [field]: nextValue,
          updatedAt: serverTimestamp(),
        }).catch((error) => {
          console.error(`Failed to sync ${field} to Firestore:`, error);
        });

        setMealPlans((prevPlans) =>
          prevPlans
            .map((plan) =>
              plan.id === activePlanId
                ? {
                    ...plan,
                    [field]: nextValue,
                    updatedAt: new Date(),
                  }
                : plan,
            )
            .sort(comparePlansByRecent),
        );
      }

      return nextSettings;
    });
  };

  const setCalorieGoal = (value) => {
    updateSettingField("calorieGoal", value, normalizePositiveNumber);
  };

  const setPrepDays = (value) => {
    updateSettingField("prepDays", value, normalizePositiveInteger);
  };

  const createMealPlan = async (name) => {
    if (!db || !user?.uid) {
      return null;
    }

    const normalizedName = normalizePlanName(name);
    const now = new Date();
    const totalKcal = calculatePlanCalories(meals);
    const payload = {
      name: normalizedName,
      meals,
      calorieGoal: settings.calorieGoal,
      prepDays: settings.prepDays,
      totalKcal,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const planDocRef = await addDoc(
        collection(db, "users", user.uid, "mealPlans"),
        payload,
      );

      const nextPlan = {
        id: planDocRef.id,
        name: normalizedName,
        meals,
        calorieGoal: settings.calorieGoal,
        prepDays: settings.prepDays,
        totalKcal,
        createdAt: now,
        updatedAt: now,
      };

      setMealPlans((prevPlans) =>
        [nextPlan, ...prevPlans].sort(comparePlansByRecent),
      );
      setActivePlanId(planDocRef.id);
      setIsInitialPlanSetupRequired(false);

      await setDoc(
        doc(db, "users", user.uid),
        {
          activePlanId: planDocRef.id,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      return planDocRef.id;
    } catch (error) {
      console.error("Failed to create meal plan:", error);
      return null;
    }
  };

  const selectMealPlan = async (planId) => {
    if (!db || !user?.uid) {
      return;
    }

    const selectedPlan = mealPlans.find((plan) => plan.id === planId);
    if (!selectedPlan) {
      return;
    }

    setActivePlanId(planId);
    setMeals(selectedPlan.meals);
    persistMealsToLocalStorage(selectedPlan.meals);

    const nextSettings = {
      calorieGoal: normalizePositiveNumber(
        selectedPlan.calorieGoal,
        DEFAULT_CALORIE_GOAL,
      ),
      prepDays: normalizePositiveInteger(
        selectedPlan.prepDays,
        DEFAULT_PREP_DAYS,
      ),
    };

    setSettings(nextSettings);
    persistSettingsToLocalStorage(nextSettings);
    setIsInitialPlanSetupRequired(false);

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          activePlanId: planId,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Failed to set active meal plan:", error);
    }
  };

  const deleteMealPlan = async (planId) => {
    if (!db || !user?.uid) {
      return;
    }

    const nextMealPlans = mealPlans.filter((plan) => plan.id !== planId);

    try {
      await deleteDoc(doc(db, "users", user.uid, "mealPlans", planId));
      setMealPlans(nextMealPlans);

      if (activePlanId !== planId) {
        return;
      }

      if (nextMealPlans.length === 0) {
        setActivePlanId(null);
        setIsInitialPlanSetupRequired(true);

        await setDoc(
          doc(db, "users", user.uid),
          {
            activePlanId: null,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        return;
      }

      const nextActivePlan = [...nextMealPlans].sort(comparePlansByRecent)[0];
      await selectMealPlan(nextActivePlan.id);
    } catch (error) {
      console.error("Failed to delete meal plan:", error);
    }
  };

  const syncWithGoogle = async () => {
    const authDependencies = await ensureAuthReady();
    if (!authDependencies) {
      console.warn(
        "Firebase auth is not configured. Add VITE_FIREBASE_* env vars to enable sign-in.",
      );
      return false;
    }

    try {
      await authDependencies.signInWithPopup(
        authDependencies.auth,
        authDependencies.googleProvider,
      );
      setAuthRestoreMarker(true);
      return true;
    } catch (error) {
      console.error("Sign-in failed:", error);
      return false;
    }
  };

  const signOutUser = async () => {
    const authDependencies = authRuntimeRef.current;
    if (!authDependencies) {
      return false;
    }

    try {
      await authDependencies.signOut(authDependencies.auth);
      setAuthRestoreMarker(false);
      return true;
    } catch (error) {
      console.error("Sign-out failed:", error);
      return false;
    }
  };

  return {
    user,
    meals,
    setMeals: updateMeals,
    calorieGoal: settings.calorieGoal,
    prepDays: settings.prepDays,
    setCalorieGoal,
    setPrepDays,
    mealPlans,
    activePlanId,
    isPlansLoading,
    isInitialPlanSetupRequired,
    createMealPlan,
    selectMealPlan,
    deleteMealPlan,
    syncWithGoogle,
    signOutUser,
  };
}
