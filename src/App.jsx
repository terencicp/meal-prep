import React, { useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
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
    const isLoggedIn = Boolean(auth?.currentUser);
    const hasLocalData = hasStoredPlannerData();

    return !isLoggedIn && !hasLocalData ? "planner" : "prepare";
  });
  const {
    user,
    meals,
    setMeals,
    calorieGoal,
    setCalorieGoal,
    prepDays,
    setPrepDays,
  } = useSyncMeals();
  const [mealToPrepare, setMealToPrepare] = useState(getDefaultMealByLocalHour);
  const [checkedItems, setCheckedItems] = useState({});
  const [checkedShoppingItems, setCheckedShoppingItems] = useState({});

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
    if (!auth || !googleProvider) {
      console.warn(
        "Firebase auth is not configured. Add VITE_FIREBASE_* env vars to enable sign-in.",
      );
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign-in failed:", error);
    }
  };

  const handleSignOut = async () => {
    if (!auth) {
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out failed:", error);
    }
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
        className='px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors'
      >
        Sign Out
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
    </div>
  );
}
