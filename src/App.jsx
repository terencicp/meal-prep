import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useSyncMeals } from "./hooks/useSyncMeals";
import { useSyncTracker } from "./hooks/useSyncTracker";
import { useMealCalculations } from "./hooks/useMealCalculations";
import { usePriceTracker } from "./hooks/usePriceTracker";
import {
  LOCAL_STORAGE_PREP_STATE_KEY,
  LOCAL_STORAGE_MEALS_KEY,
  LOCAL_STORAGE_SETTINGS_KEY,
} from "./data/constants";
import Header from "./components/Header";
import PrepareMealTab from "./components/PrepareMealTab";
import PlannerTab from "./components/PlannerTab";
import ShoppingTab from "./components/ShoppingTab";
import ShoppingPriceTracker from "./components/ShoppingPriceTracker";
import MealPlansModal from "./components/MealPlansModal";
import FoodGroupsModal from "./components/FoodGroupsModal";
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

function normalizePrepSubstitutionsByMeal(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result = {};
  for (const [mealName, mealSubs] of Object.entries(value)) {
    if (Array.isArray(mealSubs)) {
      const valid = mealSubs.filter(
        (sub) =>
          sub &&
          typeof sub === "object" &&
          Array.isArray(sub.sourceIds) &&
          sub.sourceIds.length > 0 &&
          sub.sourceIds.every((id) => typeof id === "string") &&
          typeof sub.replacementFoodId === "string" &&
          typeof sub.anchorFoodId === "string",
      );
      if (valid.length > 0) {
        result[mealName] = valid;
      }
    } else if (mealSubs && typeof mealSubs === "object") {
      // Migrate legacy { sourceFoodId: replacementFoodId } shape.
      const migrated = Object.entries(mealSubs)
        .filter(
          ([sourceId, replacementId]) =>
            typeof sourceId === "string" && typeof replacementId === "string",
        )
        .map(([sourceId, replacementId]) => ({
          sourceIds: [sourceId],
          anchorFoodId: sourceId,
          replacementFoodId: replacementId,
        }));
      if (migrated.length > 0) {
        result[mealName] = migrated;
      }
    }
  }
  return result;
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
      prepSubstitutionsByMeal: normalizePrepSubstitutionsByMeal(
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

function calculateTrackerSummary(meals, checkedItemsByMeal, visibleFoodIds) {
  let totalItems = 0;
  let totalChecked = 0;
  const byMeal = {};

  Object.entries(meals).forEach(([mealName, foodItems]) => {
    let mealTotal = 0;
    let mealChecked = 0;

    // Only visible food groups count, so grams left behind by a removed group
    // can never hold adherence below 100%.
    visibleFoodIds.forEach((foodId) => {
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

function calculateFullCompletionSummary(meals, visibleFoodIds) {
  const allCheckedByMeal = {};

  Object.entries(meals).forEach(([mealName, foodItems]) => {
    const checked = {};
    visibleFoodIds.forEach((foodId) => {
      if (foodItems[foodId] > 0) {
        checked[foodId] = foodItems[foodId];
      }
    });
    allCheckedByMeal[mealName] = checked;
  });

  return calculateTrackerSummary(meals, allCheckedByMeal, visibleFoodIds);
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hasLocalData = hasStoredPlannerData();

    return !hasLocalData ? "planner" : "prepare";
  });

  const plannerScrollRef = useRef(0);
  const mainRef = useRef(null);

  const handleTabChange = useCallback(
    (newTab) => {
      if (activeTab === "planner" && mainRef.current) {
        plannerScrollRef.current = mainRef.current.scrollTop;
      }
      setActiveTab(newTab);
    },
    [activeTab],
  );

  useLayoutEffect(() => {
    if (!mainRef.current) return;
    
    if (activeTab === "planner") {
      mainRef.current.scrollTop = plannerScrollRef.current;
    } else {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const {
    user,
    meals,
    setMeals,
    calorieGoal,
    setCalorieGoal,
    prepDays,
    setPrepDays,
    foodGroups,
    allFoodGroups,
    addFoodGroup,
    updateFoodGroup,
    deleteFoodGroup,
    setFoodGroupHidden,
    moveFoodGroup,
    getFoodGroupUsage,
    mealPlans,
    activePlanId,
    isPlansLoading,
    isInitialPlanSetupRequired,
    createMealPlan,
    updateMealPlanDetails,
    selectMealPlan,
    deleteMealPlan,
    syncWithGoogle,
    signOutUser,
  } = useSyncMeals();
  const {
    syncTrackerToFirebase,
    clearTrackerDayInFirebase,
    loadTrackerHistory,
    trackerHistory,
  } = useSyncTracker();
  const initialPrepStateRef = useRef(loadPrepStateFromLocalStorage());
  const [mealToPrepare, setMealToPrepare] = useState(getDefaultMealByLocalHour);
  const [checkedItemsByMeal, setCheckedItemsByMeal] = useState(
    initialPrepStateRef.current.checkedItemsByMeal,
  );
  const [prepSubstitutionsByMeal, setPrepSubstitutionsByMeal] = useState(
    initialPrepStateRef.current.prepSubstitutionsByMeal,
  );
  const [isSubstitutionMode, setIsSubstitutionMode] = useState(false);
  const [selectedSubstitutionAnchors, setSelectedSubstitutionAnchors] =
    useState([]);
  const [prepStateDateKey, setPrepStateDateKey] = useState(
    initialPrepStateRef.current.dateKey,
  );
  const [substitutionModalContext, setSubstitutionModalContext] = useState({
    isOpen: false,
    mealName: null,
  });
  const [checkedShoppingItems, setCheckedShoppingItems] = useState({});
  const [isMealPlansModalVisible, setIsMealPlansModalVisible] = useState(false);
  const [isFoodGroupsModalOpen, setIsFoodGroupsModalOpen] = useState(false);

  const isMealPlansModalOpen = Boolean(user) && isMealPlansModalVisible;
  const isFoodGroupsModalVisible = Boolean(user) && isFoodGroupsModalOpen;
  const hasActiveSavedPlan = Boolean(user && activePlanId);
  const visibleFoodIds = useMemo(
    () => foodGroups.map((food) => food.id),
    [foodGroups],
  );
  const plannerTitle = !user
    ? "Daily totals"
    : activePlanId
      ? mealPlans.find((plan) => plan.id === activePlanId)?.name || "Meal plan"
      : "Unsaved plan";

  // A signed-in account with no plans yet needs to save the one on screen
  // before anything else in the modal makes sense.
  useEffect(() => {
    if (isInitialPlanSetupRequired) {
      setIsMealPlansModalVisible(true);
    }
  }, [isInitialPlanSetupRequired]);

  const checkedItems = checkedItemsByMeal[mealToPrepare] || {};
  const substitutionsForMeal = prepSubstitutionsByMeal[mealToPrepare] || [];
  const isSubstitutionModalOpen = Boolean(substitutionModalContext.isOpen);
  const modalMealName = substitutionModalContext.mealName;
  const modalSelectionInfo = useMemo(() => {
    if (!isSubstitutionModalOpen || !modalMealName) {
      return { sources: [], restoreInfo: null };
    }

    const mealSubs = prepSubstitutionsByMeal[modalMealName] || [];
    const mealFoods = meals[modalMealName] || {};
    const sources = [];
    const seenSourceIds = new Set();

    selectedSubstitutionAnchors.forEach((anchor) => {
      const sub = mealSubs.find((s) => s.anchorFoodId === anchor);
      const sourceIds = sub ? sub.sourceIds : [anchor];
      sourceIds.forEach((sourceId) => {
        if (seenSourceIds.has(sourceId)) {
          return;
        }
        seenSourceIds.add(sourceId);
        sources.push({
          foodId: sourceId,
          grams: mealFoods[sourceId] || 0,
        });
      });
    });

    let restoreInfo = null;
    if (selectedSubstitutionAnchors.length === 1) {
      const sub = mealSubs.find(
        (s) => s.anchorFoodId === selectedSubstitutionAnchors[0],
      );
      if (sub) {
        restoreInfo = {
          sourceIds: sub.sourceIds,
          replacementFoodId: sub.replacementFoodId,
        };
      }
    }

    return { sources, restoreInfo };
  }, [
    isSubstitutionModalOpen,
    modalMealName,
    selectedSubstitutionAnchors,
    prepSubstitutionsByMeal,
    meals,
  ]);

  const closeSubstitutionModal = useCallback(() => {
    setSubstitutionModalContext({ isOpen: false, mealName: null });
  }, []);

  const cancelSubstitutionMode = useCallback(() => {
    setSelectedSubstitutionAnchors([]);
    setIsSubstitutionMode(false);
    closeSubstitutionModal();
  }, [closeSubstitutionModal]);

  const currentPrepSummary = useMemo(() => {
    return calculateTrackerSummary(meals, checkedItemsByMeal, visibleFoodIds);
  }, [meals, checkedItemsByMeal, visibleFoodIds]);

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

  const toggleTrackerDayCompletion = useCallback(
    (dateKey, shouldComplete) => {
      if (!user) return;

      if (shouldComplete) {
        syncTrackerToFirebase(
          dateKey,
          calculateFullCompletionSummary(meals, visibleFoodIds),
        );
      } else {
        clearTrackerDayInFirebase(dateKey);
      }
    },
    [
      user,
      meals,
      visibleFoodIds,
      syncTrackerToFirebase,
      clearTrackerDayInFirebase,
    ],
  );

  const clearDailyPrepState = useCallback(() => {
    setCheckedItemsByMeal({});
    setPrepSubstitutionsByMeal({});
    setSelectedSubstitutionAnchors([]);
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

  const setRowChecked = (mealName, sourceFoodIds, nextChecked) => {
    setCheckedItemsByMeal((prev) => {
      const prevMeal = prev[mealName] || {};
      const nextMeal = { ...prevMeal };
      sourceFoodIds.forEach((foodId) => {
        if (nextChecked) {
          nextMeal[foodId] = true;
        } else {
          delete nextMeal[foodId];
        }
      });
      return { ...prev, [mealName]: nextMeal };
    });
  };

  const toggleCheckRow = (mealName, sourceFoodIds) => {
    const mealChecks = checkedItemsByMeal[mealName] || {};
    const allChecked = sourceFoodIds.every((id) => Boolean(mealChecks[id]));
    setRowChecked(mealName, sourceFoodIds, !allChecked);
  };

  const enterSubstitutionMode = () => {
    setSelectedSubstitutionAnchors([]);
    setIsSubstitutionMode(true);
  };

  const toggleSubstitutionRowSelection = (anchorFoodId) => {
    setSelectedSubstitutionAnchors((prev) =>
      prev.includes(anchorFoodId)
        ? prev.filter((id) => id !== anchorFoodId)
        : [...prev, anchorFoodId],
    );
  };

  const handleSubstituteFoodButtonClick = () => {
    if (!isSubstitutionMode) {
      const mealFoods = meals[mealToPrepare] || {};
      const mealSubs = prepSubstitutionsByMeal[mealToPrepare] || [];
      const subByAnchor = new Map(mealSubs.map((s) => [s.anchorFoodId, s]));
      const sourceIdsInSubs = new Set();
      mealSubs.forEach((s) =>
        s.sourceIds.forEach((id) => sourceIdsInSubs.add(id)),
      );

      const displayableAnchors = [];
      foodGroups.forEach((food) => {
        if ((mealFoods[food.id] || 0) <= 0) return;
        if (subByAnchor.has(food.id)) {
          displayableAnchors.push(food.id);
          return;
        }
        if (sourceIdsInSubs.has(food.id)) return;
        displayableAnchors.push(food.id);
      });

      if (displayableAnchors.length === 1) {
        const onlyAnchor = displayableAnchors[0];
        const sub = subByAnchor.get(onlyAnchor);
        const sourceIds = sub ? sub.sourceIds : [onlyAnchor];
        const checks = checkedItemsByMeal[mealToPrepare] || {};
        const allChecked = sourceIds.every((id) => Boolean(checks[id]));
        if (!allChecked) {
          setSelectedSubstitutionAnchors([onlyAnchor]);
          setIsSubstitutionMode(true);
          setSubstitutionModalContext({
            isOpen: true,
            mealName: mealToPrepare,
          });
          return;
        }
      }

      enterSubstitutionMode();
      return;
    }

    if (selectedSubstitutionAnchors.length === 0) {
      cancelSubstitutionMode();
      return;
    }

    setSubstitutionModalContext({ isOpen: true, mealName: mealToPrepare });
  };

  const applySubstitution = (replacementFoodId) => {
    if (!modalMealName || selectedSubstitutionAnchors.length === 0) {
      return;
    }

    const anchors = selectedSubstitutionAnchors;
    const firstAnchor = anchors[0];

    setPrepSubstitutionsByMeal((prev) => {
      const currentMealSubs = prev[modalMealName] || [];

      const sourceIds = [];
      const seen = new Set();
      anchors.forEach((anchor) => {
        const sub = currentMealSubs.find((s) => s.anchorFoodId === anchor);
        const ids = sub ? sub.sourceIds : [anchor];
        ids.forEach((id) => {
          if (!seen.has(id)) {
            seen.add(id);
            sourceIds.push(id);
          }
        });
      });

      const remainingSubs = currentMealSubs.filter(
        (s) => !anchors.includes(s.anchorFoodId),
      );
      const newSub = {
        sourceIds,
        anchorFoodId: firstAnchor,
        replacementFoodId,
      };

      return { ...prev, [modalMealName]: [...remainingSubs, newSub] };
    });

    setSelectedSubstitutionAnchors([]);
    setIsSubstitutionMode(false);
    closeSubstitutionModal();
  };

  const restoreSelectedSubstitution = () => {
    if (!modalMealName || selectedSubstitutionAnchors.length !== 1) {
      return;
    }

    const anchor = selectedSubstitutionAnchors[0];

    setPrepSubstitutionsByMeal((prev) => {
      const currentMealSubs = prev[modalMealName] || [];
      const remainingSubs = currentMealSubs.filter(
        (s) => s.anchorFoodId !== anchor,
      );
      if (remainingSubs.length === 0) {
        const { [modalMealName]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [modalMealName]: remainingSubs };
    });

    setSelectedSubstitutionAnchors([]);
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
    }
  };

  const closeMealPlansModal = () => {
    setIsMealPlansModalVisible(false);
  };

  const handleCreateMealPlan = async (details) => {
    const createdPlanId = await createMealPlan(details);
    if (!createdPlanId) {
      return;
    }

    setIsMealPlansModalVisible(false);
  };

  const handleUpdateMealPlan = async (planId, details) => {
    await updateMealPlanDetails(planId, details);
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
    foodGroups,
  });

  const priceTracker = usePriceTracker({ shoppingList });

  // --- RENDERERS ---
  return (
    <div className='h-[100dvh] flex flex-col bg-[#EFEFEF] text-slate-800 font-sans'>
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isLoggedIn={Boolean(user)}
        hasActiveSavedPlan={hasActiveSavedPlan}
      />

      <main
        ref={mainRef}
        className='flex-1 overflow-y-auto overscroll-y-none'
      >
        <div 
          className={`max-w-5xl mx-auto px-4 sm:px-6 pb-20 ${
            activeTab === "planner" ? "pt-6" : "pt-8"
          }`}
        >
          {activeTab === "prepare" && (
            <PrepareMealTab
            meals={meals}
            mealToPrepare={mealToPrepare}
            setMealToPrepare={setMealToPrepare}
            checkedItems={checkedItems}
            foodGroups={foodGroups}
            allFoodGroups={allFoodGroups}
            substitutions={substitutionsForMeal}
            isSubstitutionMode={isSubstitutionMode}
            selectedSubstitutionAnchors={selectedSubstitutionAnchors}
            toggleCheckRow={(sourceFoodIds) =>
              toggleCheckRow(mealToPrepare, sourceFoodIds)
            }
            toggleSubstitutionRowSelection={toggleSubstitutionRowSelection}
            onSubstituteFoodButtonClick={handleSubstituteFoodButtonClick}
            setActiveTab={handleTabChange}
            trackerLast30DaysPercent={trackerLast30DaysPercent}
          />
        )}

        {activeTab === "tracker" && (
          <TrackerCalendarTab
            trackerHistory={trackerHistory}
            onBack={() => handleTabChange("prepare")}
            currentPrepDateKey={prepStateDateKey}
            currentPrepSummary={currentPrepSummary}
            canEditHistory={Boolean(user)}
            onToggleDayCompletion={toggleTrackerDayCompletion}
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
            foodGroups={foodGroups}
            plannerTitle={plannerTitle}
            user={user}
            onOpenFoodGroups={() => setIsFoodGroupsModalOpen(true)}
            onOpenMealPlans={() => setIsMealPlansModalVisible(true)}
            onSignIn={handleSaveClick}
            onSignOut={handleSignOut}
          />
        )}

        {activeTab === "shopping" && (
          <ShoppingTab
            prepDays={prepDays}
            setPrepDays={setPrepDays}
            shoppingList={shoppingList}
            checkedShoppingItems={checkedShoppingItems}
            toggleShoppingItem={toggleShoppingItem}
            setActiveTab={handleTabChange}
            priceTracker={priceTracker}
          />
        )}

        {activeTab === "shopping-price-tracker" && (
          <ShoppingPriceTracker
            onBack={() => handleTabChange("shopping")}
            priceTracker={priceTracker}
          />
        )}
        </div>
      </main>

      <MealPlansModal
        isOpen={isMealPlansModalOpen}
        canClose
        onClose={closeMealPlansModal}
        mealPlans={mealPlans}
        activePlanId={activePlanId}
        isPlansLoading={isPlansLoading}
        isInitialPlanSetupRequired={isInitialPlanSetupRequired}
        onCreatePlan={handleCreateMealPlan}
        onUpdatePlan={handleUpdateMealPlan}
        onSelectPlan={handleSelectMealPlan}
        onDeletePlan={handleDeleteMealPlan}
      />

      <FoodGroupsModal
        isOpen={isFoodGroupsModalVisible}
        onClose={() => setIsFoodGroupsModalOpen(false)}
        allFoodGroups={allFoodGroups}
        onAdd={addFoodGroup}
        onUpdate={updateFoodGroup}
        onDelete={deleteFoodGroup}
        onSetHidden={setFoodGroupHidden}
        onMove={moveFoodGroup}
        getUsage={getFoodGroupUsage}
      />

      <SubstitutionsModal
        isOpen={isSubstitutionModalOpen}
        mealName={modalMealName}
        foodGroups={allFoodGroups}
        sources={modalSelectionInfo.sources}
        restoreInfo={modalSelectionInfo.restoreInfo}
        onClose={cancelSubstitutionMode}
        onApplySubstitution={applySubstitution}
        onRestoreSubstitution={restoreSelectedSubstitution}
      />
    </div>
  );
}
