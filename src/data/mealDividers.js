import { MEAL_NAMES } from "./constants";

// A divider starts a new plate group before a food, independently per meal.
export function normalizeMealDividers(value) {
  return Object.fromEntries(
    MEAL_NAMES.map((meal) => [
      meal,
      [
        ...new Set(
          Array.isArray(value?.[meal])
            ? value[meal].filter((id) => typeof id === "string")
            : [],
        ),
      ],
    ]),
  );
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
