import React, { useState } from "react";
import { useSyncMeals } from "./hooks/useSyncMeals";
import { useMealCalculations } from "./hooks/useMealCalculations";
import {
  LOCAL_STORAGE_MEALS_KEY,
  LOCAL_STORAGE_SETTINGS_KEY,
} from "./data/constants";
import Header from "./components/Header";
import PrepareMealTab from "./components/PrepareMealTab";
import PlannerTab from "./components/PlannerTab";
import ShoppingTab from "./components/ShoppingTab";
import MealPlansModal from "./components/MealPlansModal";

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
    isInitialPlanSetupRequired,
    createMealPlan,
    selectMealPlan,
    deleteMealPlan,
    syncWithGoogle,
    signOutUser,
  } = useSyncMeals();
  const [mealToPrepare, setMealToPrepare] = useState(getDefaultMealByLocalHour);
  const [checkedItems, setCheckedItems] = useState({});
  const [checkedShoppingItems, setCheckedShoppingItems] = useState({});
  const [isMealPlansModalVisible, setIsMealPlansModalVisible] = useState(false);
  const [planNameInput, setPlanNameInput] = useState("");

  const isMealPlansModalOpen = Boolean(user) && isMealPlansModalVisible;
  const hasActiveSavedPlan = Boolean(user && activePlanId);
  const activeMealPlanName =
    user && activePlanId
      ? mealPlans.find((plan) => plan.id === activePlanId)?.name || "Meal plan"
      : null;

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

  const toggleCheckItem = (foodId) => {
    setCheckedItems((prev) => ({
      ...prev,
      [foodId]: !prev[foodId],
    }));
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
      className='px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors'
    >
      Sync with Google
    </button>
  ) : (
    <div className='flex items-center space-x-2'>
      <button
        onClick={() => setIsMealPlansModalVisible(true)}
        className='min-w-30 py-2 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors'
      >
        {hasActiveSavedPlan ? "Switch plan" : "Save plan"}
      </button>
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt='Profile'
          className='w-8 h-8 rounded-full object-cover border border-slate-200'
        />
      ) : (
        <div className='w-8 h-8 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center border border-slate-300'>
          {(user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
        </div>
      )}
      <button
        onClick={handleSignOut}
        className='min-w-30 py-2 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors'
      >
        Sign out
      </button>
    </div>
  );

  // --- RENDERERS ---
  return (
    <div className='min-h-screen bg-slate-50 text-slate-800 font-sans pb-20'>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={Boolean(user)}
        hasActiveSavedPlan={hasActiveSavedPlan}
      />

      <main className='max-w-5xl mx-auto px-4 sm:px-6 py-8'>
        {activeTab === "prepare" && (
          <PrepareMealTab
            meals={meals}
            mealToPrepare={mealToPrepare}
            setMealToPrepare={setMealToPrepare}
            checkedItems={checkedItems}
            setCheckedItems={setCheckedItems}
            toggleCheckItem={toggleCheckItem}
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
        isInitialPlanSetupRequired={isInitialPlanSetupRequired}
        planNameInput={planNameInput}
        setPlanNameInput={setPlanNameInput}
        isPlansLoading={isPlansLoading}
        onSavePlan={handleSaveMealPlan}
        onSelectPlan={handleSelectMealPlan}
        onDeletePlan={handleDeleteMealPlan}
      />
    </div>
  );
}
