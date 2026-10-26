import { MEAL_NAMES } from "./constants.js";

// Dividers belong to the plan's shared food list. Preserve existing splits
// when reading the legacy shape that stored a separate list for each meal.
export function normalizeMealDividers(value) {
  const ids = Array.isArray(value)
    ? value
    : MEAL_NAMES.flatMap((meal) =>
        Array.isArray(value?.[meal]) ? value[meal] : [],
      );
  return [...new Set(ids.filter((id) => typeof id === "string"))];
}

export function getMealGroupByFood(foodGroups, dividerIds = []) {
  const dividers = new Set(dividerIds);
  let group = 0;
  return new Map(
    foodGroups.map((food, index) => {
      if (index > 0 && dividers.has(food.id)) group += 1;
      return [food.id, group];
    }),
  );
}
