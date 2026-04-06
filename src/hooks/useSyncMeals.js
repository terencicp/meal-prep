import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  DEFAULT_CALORIE_GOAL,
  DEFAULT_PREP_DAYS,
  INITIAL_MEALS,
  LOCAL_STORAGE_MEALS_KEY,
  LOCAL_STORAGE_SETTINGS_KEY,
} from "../data/constants";

function normalizePositiveNumber(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function normalizePositiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
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

export function useSyncMeals() {
  const [user, setUser] = useState(null);
  const [meals, setMeals] = useState(loadMealsFromLocalStorage);
  const [settings, setSettings] = useState(loadSettingsFromLocalStorage);

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

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const syncMealsAfterLogin = async () => {
      if (!db || !user?.uid) {
        return;
      }

      const userDocRef = doc(db, "users", user.uid);

      try {
        const snapshot = await getDoc(userDocRef);
        const cloudData = snapshot.exists() ? snapshot.data() : null;
        const updatesToUpload = { updatedAt: serverTimestamp() };
        let hasCloudSettings = false;

        // Handshake behavior:
        // 1) If cloud meal plan exists, use cloud as source of truth.
        // 2) If cloud meal plan does not exist, upload current local guest meals.
        if (cloudData?.mealPlan && typeof cloudData.mealPlan === "object") {
          const cloudMeals = cloudData.mealPlan;
          setMeals(cloudMeals);
          persistMealsToLocalStorage(cloudMeals);
        } else {
          updatesToUpload.mealPlan = loadMealsFromLocalStorage();
        }

        const cloudCalorieGoal = normalizePositiveNumber(
          cloudData?.calorieGoal,
          null,
        );
        const cloudPrepDays = normalizePositiveInteger(
          cloudData?.prepDays,
          null,
        );

        if (cloudCalorieGoal !== null || cloudPrepDays !== null) {
          const nextSettings = {
            calorieGoal: cloudCalorieGoal ?? settings.calorieGoal,
            prepDays: cloudPrepDays ?? settings.prepDays,
          };

          setSettings(nextSettings);
          persistSettingsToLocalStorage(nextSettings);
          hasCloudSettings = true;

          // Backfill any missing cloud fields so future devices are consistent.
          if (cloudCalorieGoal === null) {
            updatesToUpload.calorieGoal = settings.calorieGoal;
          }
          if (cloudPrepDays === null) {
            updatesToUpload.prepDays = settings.prepDays;
          }
        }

        if (!hasCloudSettings) {
          const localSettings = loadSettingsFromLocalStorage();
          setSettings(localSettings);
          persistSettingsToLocalStorage(localSettings);
          updatesToUpload.calorieGoal = localSettings.calorieGoal;
          updatesToUpload.prepDays = localSettings.prepDays;
        }

        const uploadKeys = Object.keys(updatesToUpload).filter(
          (key) => key !== "updatedAt",
        );
        if (uploadKeys.length > 0) {
          await setDoc(userDocRef, updatesToUpload, { merge: true });
        }
      } catch (error) {
        console.error(
          "Failed to sync meal plan during login handshake:",
          error,
        );
      }
    };

    void syncMealsAfterLogin();
  }, [user]);

  const updateMeals = (updater) => {
    setMeals((prev) => {
      const nextMeals = typeof updater === "function" ? updater(prev) : updater;

      persistMealsToLocalStorage(nextMeals);

      if (db && user?.uid) {
        const userDocRef = doc(db, "users", user.uid);
        void setDoc(
          userDocRef,
          {
            mealPlan: nextMeals,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        ).catch((error) => {
          console.error("Failed to sync meal plan to Firestore:", error);
        });
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

      if (db && user?.uid) {
        const userDocRef = doc(db, "users", user.uid);
        void setDoc(
          userDocRef,
          {
            [field]: nextValue,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        ).catch((error) => {
          console.error(`Failed to sync ${field} to Firestore:`, error);
        });
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

  return {
    user,
    meals,
    setMeals: updateMeals,
    calorieGoal: settings.calorieGoal,
    prepDays: settings.prepDays,
    setCalorieGoal,
    setPrepDays,
  };
}
