import { useMemo } from "react";
import { MEAL_NAMES } from "../data/constants";

export function useMealCalculations({
  meals,
  calorieGoal,
  prepDays,
  foodGroups,
}) {
  const mealTotals = useMemo(() => {
    const totals = {};
    MEAL_NAMES.forEach((meal) => {
      totals[meal] = { kCal: 0, carbs: 0, fats: 0, protein: 0 };
      foodGroups.forEach((food) => {
        const grams = meals[meal]?.[food.id] || 0;
        const factor = grams / 100;
        totals[meal].kCal += food.kCal * factor;
        totals[meal].carbs += food.carbs * factor;
        totals[meal].fats += food.fats * factor;
        totals[meal].protein += food.protein * factor;
      });
    });
    return totals;
  }, [meals, foodGroups]);

  const dailyTotals = useMemo(() => {
    const totals = { kCal: 0, carbs: 0, fats: 0, protein: 0, weight: 0 };
    Object.values(mealTotals).forEach((meal) => {
      totals.kCal += meal.kCal;
      totals.carbs += meal.carbs;
      totals.fats += meal.fats;
      totals.protein += meal.protein;
    });

    Object.values(meals).forEach((mealObj) => {
      foodGroups.forEach((food) => {
        totals.weight += mealObj?.[food.id] || 0;
      });
    });

    return totals;
  }, [mealTotals, meals, foodGroups]);

  const shoppingList = useMemo(() => {
    return foodGroups.map((food) => {
      const dailyGrams = Object.values(meals).reduce(
        (acc, meal) => acc + (meal[food.id] || 0),
        0,
      );
      const prepGrams = dailyGrams * prepDays;
      const finalAmountKg = (prepGrams / 1000) * food.waste;

      return {
        ...food,
        dailyGrams,
        finalAmountKg,
        hasWasteMultiplier: food.waste > 1.0,
      };
    }).filter((item) => item.finalAmountKg > 0);
  }, [meals, prepDays, foodGroups]);

  const macroKcalTotal =
    dailyTotals.carbs * 4 + dailyTotals.fats * 9 + dailyTotals.protein * 4;
  const carbsPct =
    macroKcalTotal > 0 ? ((dailyTotals.carbs * 4) / macroKcalTotal) * 100 : 0;
  const fatsPct =
    macroKcalTotal > 0 ? ((dailyTotals.fats * 9) / macroKcalTotal) * 100 : 0;
  const proteinPct =
    macroKcalTotal > 0 ? ((dailyTotals.protein * 4) / macroKcalTotal) * 100 : 0;

  const kcalPct = Math.min((dailyTotals.kCal / calorieGoal) * 100, 100);
  const kcalDiff = dailyTotals.kCal - calorieGoal;
  const absKcalDiff = Math.abs(Math.round(kcalDiff));
  const tolerance = calorieGoal * 0.1;
  const isOutsideTolerance = absKcalDiff > tolerance;

  return {
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
  };
}
