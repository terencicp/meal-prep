// Nutritional values per 100g.
export const FOOD_GROUPS = [
  {
    id: "seeds",
    name: "Seeds",
    kCal: 110,
    carbs: 24,
    fats: 0.9,
    protein: 7,
    waste: 0.5,
    color: "bg-pink-200",
    text: "text-pink-800",
    border: "border-pink-200",
    iconColor: "text-pink-500",
  },
  {
    id: "starches",
    name: "Starches",
    kCal: 80,
    carbs: 19,
    fats: 0.1,
    protein: 1.75,
    waste: 1.3,
    color: "bg-pink-300",
    text: "text-pink-900",
    border: "border-pink-300",
    iconColor: "text-pink-500",
  },
  {
    id: "veggies",
    name: "Veggies",
    kCal: 35,
    carbs: 6,
    fats: 0.4,
    protein: 2.5,
    waste: 1.3,
    color: "bg-green-300",
    text: "text-green-900",
    border: "border-green-300",
    iconColor: "text-green-500",
  },
  {
    id: "fruit",
    name: "Fruit",
    kCal: 54,
    carbs: 14,
    fats: 0.4,
    protein: 1.1,
    waste: 1.3,
    color: "bg-yellow-200",
    text: "text-yellow-900",
    border: "border-yellow-300",
    iconColor: "text-yellow-500",
  },
  {
    id: "avocado",
    name: "Avocado",
    kCal: 160,
    carbs: 8.5,
    fats: 15,
    protein: 2,
    waste: 1.3,
    color: "bg-orange-300",
    text: "text-orange-900",
    border: "border-orange-300",
    iconColor: "text-orange-500",
  },
  {
    id: "nuts",
    name: "Nuts",
    kCal: 550,
    carbs: 23,
    fats: 46,
    protein: 16,
    waste: 1.0,
    color: "bg-orange-200",
    text: "text-orange-800",
    border: "border-orange-200",
    iconColor: "text-orange-500",
  },
  {
    id: "meat",
    name: "Meat",
    kCal: 230,
    carbs: 0,
    fats: 15,
    protein: 28,
    waste: 1.0,
    color: "bg-cyan-200",
    text: "text-cyan-900",
    border: "border-cyan-200",
    iconColor: "text-cyan-500",
  },
  {
    id: "yogurt",
    name: "Yogurt",
    kCal: 60,
    carbs: 5,
    fats: 2,
    protein: 6,
    waste: 1.0,
    color: "bg-sky-200",
    text: "text-sky-900",
    border: "border-sky-200",
    iconColor: "text-sky-500",
  },
  {
    id: "eggs",
    name: "Eggs",
    kCal: 155,
    carbs: 1.1,
    fats: 11,
    protein: 13,
    waste: 1.0,
    color: "bg-teal-200",
    text: "text-teal-900",
    border: "border-teal-200",
    iconColor: "text-teal-500",
  },
];

export const MEAL_NAMES = ["Breakfast", "Lunch", "Dinner"];
export const LOCAL_STORAGE_MEALS_KEY = "mealPlannerMeals";
export const LOCAL_STORAGE_SETTINGS_KEY = "mealPlannerSettings";
export const LOCAL_STORAGE_AUTH_ACTIVE_KEY = "mealPlannerAuthActive";
export const LOCAL_STORAGE_PREP_STATE_KEY = "mealPlannerPrepState";
export const LOCAL_STORAGE_FOOD_GROUPS_KEY = "mealPlannerFoodGroups";

export const PLAN_NAME_MAX_LENGTH = 70;
export const PLAN_DESCRIPTION_MAX_LENGTH = 140;

export const DEFAULT_PREP_DAYS = 4;
export const DEFAULT_CALORIE_GOAL = 2000;

export const INITIAL_MEALS = {
  Breakfast: { seeds: 70, veggies: 300, fruit: 70, nuts: 30, meat: 50 },
  Lunch: { starches: 70, veggies: 300, fruit: 70, nuts: 30, yogurt: 60 },
  Dinner: { seeds: 70, veggies: 300, fruit: 70, avocado: 100, eggs: 45 },
};
