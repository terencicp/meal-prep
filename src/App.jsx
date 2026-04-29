import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useSyncMeals } from "./hooks/useSyncMeals";
import { useSyncTracker } from "./hooks/useSyncTracker";
import { useMealCalculations } from "./hooks/useMealCalculations";
import {
  LOCAL_STORAGE_PREP_STATE_KEY,
  LOCAL_STORAGE_MEALS_KEY,
  LOCAL_STORAGE_SETTINGS_KEY,
} from "./data/constants";
import Header from "./components/Header";
import PrepareMealTab from "./components/PrepareMealTab";
import PlannerTab from "./components/PlannerTab";
import ShoppingTab from "./components/ShoppingTab";
import MealPlansModal from "./components/MealPlansModal";
import SubstitutionsModal from "./components/SubstitutionsModal";
import TrackerCalendarTab from "./components/TrackerCalendarTab";

function getDefaultMealByLocalHour() {
  const hour = new Date().getHours();

  if (hour >= 12 && hour < 16) {
    return "Lunch";
  }

  if (hour >= 16 && hour < 20) {
    return "Dinner";
  }

  return "Breakfast";
}

function hasStoredPlannerData() {
  try {
    return Boolean(
      localStorage.getItem(LOCAL_STORAGE_MEALS_KEY) ||
      localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY),
    );
  } catch (error) {
    console.error("Failed to read planner data from localStorage:", error);
    return false;
  }
}

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizePrepStateObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function loadPrepStateFromLocalStorage() {
  const todayKey = getLocalDateKey();

  try {
    const storedPrepState = localStorage.getItem(LOCAL_STORAGE_PREP_STATE_KEY);
    if (!storedPrepState) {
      return {
        dateKey: todayKey,
        checkedItemsByMeal: {},
        prepSubstitutionsByMeal: {},
      };
    }

    const parsedPrepState = JSON.parse(storedPrepState);
    if (!parsedPrepState || parsedPrepState.dateKey !== todayKey) {
      return {
        dateKey: todayKey,
        checkedItemsByMeal: {},
        prepSubstitutionsByMeal: {},
      };
    }

    return {
      dateKey: todayKey,
      checkedItemsByMeal: normalizePrepStateObject(
        parsedPrepState.checkedItemsByMeal,
      ),
      prepSubstitutionsByMeal: normalizePrepStateObject(
        parsedPrepState.prepSubstitutionsByMeal,
      ),
    };
  } catch (error) {
    console.error("Failed to load prep state from localStorage:", error);
    return {
      dateKey: todayKey,
      checkedItemsByMeal: {},
      prepSubstitutionsByMeal: {},
    };
  }
}

function persistPrepStateToLocalStorage({
  dateKey,
  checkedItemsByMeal,
  prepSubstitutionsByMeal,
}) {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_PREP_STATE_KEY,
      JSON.stringify({
        dateKey,
        checkedItemsByMeal,
        prepSubstitutionsByMeal,
      }),
    );
  } catch (error) {
    console.error("Failed to save prep state to localStorage:", error);
  }
}

function calculateTrackerSummary(meals, checkedItemsByMeal) {
  let totalItems = 0;
  let totalChecked = 0;
  const byMeal = {};

  Object.entries(meals).forEach(([mealName, foodItems]) => {
    let mealTotal = 0;
    let mealChecked = 0;

    Object.keys(foodItems).forEach((foodId) => {
      const amount = foodItems[foodId];
      if (amount > 0) {
        mealTotal += 1;
        const checkedAmount = checkedItemsByMeal[mealName]?.[foodId];
        if (checkedAmount) {
          mealChecked += 1;
        }
      }
    });

    if (mealTotal > 0) {
      byMeal[mealName] = {
        checked: mealChecked,
        total: mealTotal,
        percentage: Math.round((mealChecked / mealTotal) * 100),
      };
      totalItems += mealTotal;
      totalChecked += mealChecked;
    }
  });

  return {
    totalItems,
    checkedItems: totalChecked,
    completionPercentage:
      totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0,
    byMeal,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hasLocalData = hasStoredPlannerData();

    return !hasLocalData ? "planner" : "prepare";
  });
  const {
    user,
    meals,
    setMeals,
    calorieGoal,
    setCalorieGoal,
    prepDays,
    setPrepDays,
    mealPlans,
    activePlanId,
    isPlansLoading,
    createMealPlan,
    selectMealPlan,
    deleteMealPlan,
    syncWithGoogle,
    signOutUser,
  } = useSyncMeals();
  const { syncTrackerToFirebase, loadTrackerHistory, trackerHistory } =
    useSyncTracker();
  const initialPrepStateRef = useRef(loadPrepStateFromLocalStorage());
  const [mealToPrepare, setMealToPrepare] = useState(getDefaultMealByLocalHour);
  const [checkedItemsByMeal, setCheckedItemsByMeal] = useState(
    initialPrepStateRef.current.checkedItemsByMeal,
  );
  const [prepSubstitutionsByMeal, setPrepSubstitutionsByMeal] = useState(
    initialPrepStateRef.current.prepSubstitutionsByMeal,
  );
  const [isSubstitutionMode, setIsSubstitutionMode] = useState(false);
  const [prepStateDateKey, setPrepStateDateKey] = useState(
    initialPrepStateRef.current.dateKey,
  );
  const [substitutionModalContext, setSubstitutionModalContext] = useState({
    isOpen: false,
    mealName: null,
    foodId: null,
  });
  const [checkedShoppingItems, setCheckedShoppingItems] = useState({});
  const [isMealPlansModalVisible, setIsMealPlansModalVisible] = useState(false);
  const [planNameInput, setPlanNameInput] = useState("");
  const [brokenProfileImageUrl, setBrokenProfileImageUrl] = useState(null);

  const isMealPlansModalOpen = Boolean(user) && isMealPlansModalVisible;
  const hasActiveSavedPlan = Boolean(user && activePlanId);
  const activeMealPlanName =
    user && activePlanId
      ? mealPlans.find((plan) => plan.id === activePlanId)?.name || "Meal plan"
      : null;
  const checkedItems = checkedItemsByMeal[mealToPrepare] || {};
  const substitutionsForMeal = prepSubstitutionsByMeal[mealToPrepare] || {};
  const isSubstitutionModalOpen = Boolean(substitutionModalContext.isOpen);
  const modalMealName = substitutionModalContext.mealName;
  const modalFoodId = substitutionModalContext.foodId;
  const modalFoodAmount =
    modalMealName && modalFoodId ? meals[modalMealName]?.[modalFoodId] || 0 : 0;
  const modalCurrentReplacementFoodId =
    modalMealName && modalFoodId
      ? prepSubstitutionsByMeal[modalMealName]?.[modalFoodId] || null
      : null;

  const closeSubstitutionModal = useCallback(() => {
    setSubstitutionModalContext({
      isOpen: false,
      mealName: null,
      foodId: null,
    });
  }, []);

  const currentPrepSummary = useMemo(() => {
    return calculateTrackerSummary(meals, checkedItemsByMeal);
  }, [meals, checkedItemsByMeal]);

  useEffect(() => {
    if (user) {
      syncTrackerToFirebase(prepStateDateKey, currentPrepSummary);
    }
  }, [currentPrepSummary, prepStateDateKey, user, syncTrackerToFirebase]);

  useEffect(() => {
    if (user) {
      loadTrackerHistory();
    }
  }, [user, loadTrackerHistory]);

  const trackerLast30DaysPercent = useMemo(() => {
    let sumPercentages = 0;
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;

      const data =
        dateKey === prepStateDateKey
          ? currentPrepSummary
          : trackerHistory[dateKey];
      if (data && data.completionPercentage) {
        sumPercentages += data.completionPercentage;
      }
    }
    return Math.round(sumPercentages / 30);
  }, [trackerHistory, currentPrepSummary, prepStateDateKey]);

  const clearDailyPrepState = useCallback(() => {
    setCheckedItemsByMeal({});
    setPrepSubstitutionsByMeal({});
    setIsSubstitutionMode(false);
    closeSubstitutionModal();
  }, [closeSubstitutionModal]);

  const resetDailyPrepStateIfNeeded = useCallback(() => {
    const todayKey = getLocalDateKey();

    setPrepStateDateKey((currentKey) => {
      if (currentKey === todayKey) {
        return currentKey;
      }

      clearDailyPrepState();
      return todayKey;
    });
  }, [clearDailyPrepState]);

  useEffect(() => {
    let timeoutId;

    const scheduleMidnightReset = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      const delayMs = Math.max(nextMidnight.getTime() - now.getTime(), 0) + 200;

      timeoutId = window.setTimeout(() => {
        resetDailyPrepStateIfNeeded();
        scheduleMidnightReset();
      }, delayMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetDailyPrepStateIfNeeded();
      }
    };

    scheduleMidnightReset();
    window.addEventListener("focus", resetDailyPrepStateIfNeeded);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener("focus", resetDailyPrepStateIfNeeded);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resetDailyPrepStateIfNeeded]);

  useEffect(() => {
    persistPrepStateToLocalStorage({
      dateKey: prepStateDateKey,
      checkedItemsByMeal,
      prepSubstitutionsByMeal,
    });
  }, [prepStateDateKey, checkedItemsByMeal, prepSubstitutionsByMeal]);

  // --- HANDLERS ---
  const handleGramsChange = (mealName, foodId, value) => {
    const numValue = parseInt(value, 10);

    setMeals((prev) => {
      return {
        ...prev,
        [mealName]: {
          ...prev[mealName],
          [foodId]: isNaN(numValue) ? 0 : numValue,
        },
      };
    });
  };

  const toggleCheckItem = (mealName, foodId) => {
    setCheckedItemsByMeal((prev) => ({
      ...prev,
      [mealName]: {
        ...prev[mealName],
        [foodId]: !prev[mealName]?.[foodId],
      },
    }));
  };

  const openSubstitutionModal = (mealName, foodId) => {
    setSubstitutionModalContext({
      isOpen: true,
      mealName,
      foodId,
    });
  };

  const applySubstitution = (replacementFoodId) => {
    const { mealName, foodId } = substitutionModalContext;

    if (!mealName || !foodId) {
      return;
    }

    setPrepSubstitutionsByMeal((prev) => {
      const currentMealSubstitutions = prev[mealName] || {};

      if (replacementFoodId === foodId) {
        const { [foodId]: _removed, ...remainingMealSubstitutions } =
          currentMealSubstitutions;

        if (Object.keys(remainingMealSubstitutions).length === 0) {
          const { [mealName]: _removedMeal, ...remainingMeals } = prev;
          return remainingMeals;
        }

        return {
          ...prev,
          [mealName]: remainingMealSubstitutions,
        };
      }

      return {
        ...prev,
        [mealName]: {
          ...currentMealSubstitutions,
          [foodId]: replacementFoodId,
        },
      };
    });
    setIsSubstitutionMode(false);

    closeSubstitutionModal();
  };

  const toggleShoppingItem = (foodId) => {
    setCheckedShoppingItems((prev) => ({
      ...prev,
      [foodId]: !prev[foodId],
    }));
  };

  const handleSaveClick = async () => {
    const signedIn = await syncWithGoogle();
    if (signedIn) {
      setIsMealPlansModalVisible(true);
    }
  };

  const handleSignOut = async () => {
    const signedOut = await signOutUser();
    if (signedOut) {
      setIsMealPlansModalVisible(false);
      setPlanNameInput("");
    }
  };

  const closeMealPlansModal = () => {
    setIsMealPlansModalVisible(false);
  };

  const handleSaveMealPlan = async () => {
    const createdPlanId = await createMealPlan(planNameInput);
    if (!createdPlanId) {
      return;
    }

    setPlanNameInput("");
    setIsMealPlansModalVisible(false);
  };

  const handleSelectMealPlan = async (planId) => {
    await selectMealPlan(planId);
    setIsMealPlansModalVisible(false);
  };

  const handleDeleteMealPlan = async (planId) => {
    await deleteMealPlan(planId);
  };

  const {
    mealTotals,
    dailyTotals,
    shoppingList,
    carbsPct,
    fatsPct,
    proteinPct,
    kcalPct,
    kcalDiff,
    absKcalDiff,
    isOutsideTolerance,
  } = useMealCalculations({
    meals,
    calorieGoal,
    prepDays,
  });

  const authControls = !user ? (
    <button
      onClick={handleSaveClick}
      className='px-5 py-2.5 border-4 border-black bg-[#FFD600] text-black text-sm font-black uppercase tracking-wide shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all'
    >
      Sync with Google
    </button>
  ) : (
    <div className='flex items-center gap-3 flex-wrap justify-center0'>
      <button
        onClick={() => setIsMealPlansModalVisible(true)}
        className='w-32.5 sm:w-40 px-4 py-2 border-4 border-black bg-white text-black text-xs sm:text-sm font-black uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.75 active:translate-y-0.75 active:shadow-none transition-all'
      >
        {hasActiveSavedPlan ? "Switch plan" : "Save plan"}
      </button>
      {user.photoURL && user.photoURL !== brokenProfileImageUrl ? (
        <img
          src={user.photoURL}
          alt='Profile'
          onError={() => setBrokenProfileImageUrl(user.photoURL)}
          className='w-11 h-11 rounded-full object-cover border-4 border-black mx-1'
        />
      ) : (
        <div className='w-11 h-11 rounded-full bg-slate-200 text-slate-700 text-sm font-black flex items-center justify-center border-4 border-black mx-1'>
          {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
        </div>
      )}
      <button
        onClick={handleSignOut}
        className='w-32.5 sm:w-40 px-4 py-2 border-4 border-black bg-white text-black text-xs sm:text-sm font-black uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.75 active:translate-y-0.75 active:shadow-none transition-all'
      >
        Sign out
      </button>
    </div>
  );

  // --- RENDERERS ---
  return (
    <div className='min-h-screen bg-[#EFEFEF] text-slate-800 font-sans pb-20'>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={Boolean(user)}
        hasActiveSavedPlan={hasActiveSavedPlan}
      />

      <main
        className={`max-w-5xl mx-auto px-4 sm:px-6 pb-8 ${
          activeTab === "planner" ? "pt-6" : "pt-8"
        }`}
      >
        {activeTab === "prepare" && (
          <PrepareMealTab
            meals={meals}
            mealToPrepare={mealToPrepare}
            setMealToPrepare={setMealToPrepare}
            checkedItems={checkedItems}
            substitutions={substitutionsForMeal}
            isSubstitutionMode={isSubstitutionMode}
            setIsSubstitutionMode={setIsSubstitutionMode}
            toggleCheckItem={(foodId) => toggleCheckItem(mealToPrepare, foodId)}
            openSubstitutionModal={openSubstitutionModal}
            setActiveTab={setActiveTab}
            trackerLast30DaysPercent={trackerLast30DaysPercent}
          />
        )}

        {activeTab === "tracker" && (
          <TrackerCalendarTab
            trackerHistory={trackerHistory}
            onBack={() => setActiveTab("prepare")}
            currentPrepDateKey={prepStateDateKey}
            currentPrepSummary={currentPrepSummary}
          />
        )}

        {activeTab === "planner" && (
          <PlannerTab
            meals={meals}
            mealTotals={mealTotals}
            handleGramsChange={handleGramsChange}
            calorieGoal={calorieGoal}
            setCalorieGoal={setCalorieGoal}
            dailyTotals={dailyTotals}
            kcalPct={kcalPct}
            absKcalDiff={absKcalDiff}
            kcalDiff={kcalDiff}
            isOutsideTolerance={isOutsideTolerance}
            carbsPct={carbsPct}
            fatsPct={fatsPct}
            proteinPct={proteinPct}
            activeMealPlanName={activeMealPlanName}
            authControls={authControls}
          />
        )}

        {activeTab === "shopping" && (
          <ShoppingTab
            prepDays={prepDays}
            setPrepDays={setPrepDays}
            shoppingList={shoppingList}
            checkedShoppingItems={checkedShoppingItems}
            toggleShoppingItem={toggleShoppingItem}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      <MealPlansModal
        isOpen={isMealPlansModalOpen}
        canClose
        onClose={closeMealPlansModal}
        mealPlans={mealPlans}
        activePlanId={activePlanId}
        planNameInput={planNameInput}
        setPlanNameInput={setPlanNameInput}
        isPlansLoading={isPlansLoading}
        onSavePlan={handleSaveMealPlan}
        onSelectPlan={handleSelectMealPlan}
        onDeletePlan={handleDeleteMealPlan}
      />

      <SubstitutionsModal
        isOpen={isSubstitutionModalOpen}
        mealName={modalMealName}
        sourceFoodId={modalFoodId}
        sourceFoodAmount={modalFoodAmount}
        currentReplacementFoodId={modalCurrentReplacementFoodId}
        onClose={closeSubstitutionModal}
        onApplySubstitution={applySubstitution}
      />
    </div>
  );
}
