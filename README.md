# PrepMaster

PrepMaster is a simple meal planning app focused on food group portions, calorie awareness, and practical shopping prep.

It helps you:

- Plan portions for breakfast, lunch, and dinner
- See daily calories and macro totals while you plan
- Set a calorie goal to avoid eating too little or too much
- Follow your plan during meal prep in a clean checklist view
- Generate a shopping list for a chosen number of days

## What This Project Does

This app uses 9 predefined food groups. You choose grams for each food group in each meal, and the app calculates:

- Calories and macros per meal
- Daily totals
- Progress against your calorie goal
- Shopping amounts for X days

The planner and settings are saved locally by default, and can sync with Google after logging in.

## The 9 Predefined Food Groups

1. Seeds
2. Starches
3. Veggies
4. Fruit
5. Avocado
6. Nuts
7. Meat
8. Iogurt
9. Eggs

## How It Works (High Level)

### 1) Plan meals

In the Plan meals tab, set grams for each food group in:

- Breakfast
- Lunch
- Dinner

As you edit grams, PrepMaster recalculates calories, carbs, fats, and protein in real time.

### 2) Set calorie goal

You can set a daily calorie goal in the planner.

The app compares planned calories vs goal and highlights whether you are over, under, or on target.

### 3) Prepare meal

In the Prepare meal tab, pick the meal you are about to prepare and see only the food groups with non-zero amounts for that meal.

This gives you a clean checklist of what to prepare and how much (in grams).

### 4) Build shopping list for X days

In the Shopping list tab, choose how many days you are shopping for.

PrepMaster multiplies daily planned portions by the selected days and shows how much to buy per food group.

- Most items are displayed in grams or kilograms
- Eggs are displayed as units (estimated from grams)

## Tech Stack

- React + Vite
- Firebase Auth + Firestore (optional cloud sync)
- LocalStorage fallback for local-only use
