# PrepMaster

PrepMaster is a simple meal planning app focused on calorie awareness.

It helps you:

- Plan portions for breakfast, lunch, and dinner
- See daily calories and macro totals while you plan
- Set a calorie goal to avoid eating too little or too much
- Follow your plan during meal prep in a clean checklist view
- Swap out meal food groups easily for convenience
- Generate a shopping list and compare cost accross supermarkets
- Review your adherence to the diet on a calendar

## Meal planning

The app ships with predefined food groups, and you can add your own. You choose grams for each food group in each meal, and the app calculates calories and macros per meal and daily totals. The planner and settings are saved locally by default, and can sync with Google after logging in.

## Food groups

1. Seeds (like rice, oats, lentils, chickpeas, etc.)
2. Starches (like potatoes, sweet potatoes, etc.)
3. Veggies (like broccoli, spinach, bell peppers, etc.)
4. Fruit (like banana, apple, berries, etc.)
5. Avocado
6. Nuts (like almonds, walnuts, cashews, etc.)
7. Meat (or fish)
8. Yogurt
9. Eggs

The `Food groups` button at the bottom of the `Plan meals` tab opens a modal where you can:

- **Add custom food groups** with a name, description, and calories, carbs, fats and protein per 100 g, plus an optional prep-loss multiplier (how much extra to buy to cover peel and trim — 1 means no loss). Custom groups can be edited or deleted later.
- **Hide any group** you are not using right now, predefined or custom, and show it again at any time.
- **Reorder every group** with the up and down arrows. The order applies to the planner, the prep checklist, and the shopping list.

Hiding or deleting a group that still has grams in a meal clears those grams, so totals always match what you see. **Food groups belong to the meal plan you are on**, so a cutting plan and a bulking plan can each have their own list. They are stored locally and sync to your account when you are signed in.

## Meal plans

The `Meal plans` button, next to `Food groups`, lists every plan on your account. Each one holds its own meals, food groups, calorie goal and prep days, and can carry a short description.

- **New plan** starts clean: the predefined food groups, 0 g everywhere, and the default calorie goal.
- **Duplicate plan** copies the plan you are on, food groups and grams included, so you can vary one thing without rebuilding the rest.
- Tap a plan to switch to it, or the pencil to rename it, edit its description, or delete it.

The first time you sign in, the plan you have been building locally is saved as your first meal plan.

## How it works

### 1) Set calorie goal

Start in the `Plan meals` tab by setting your daily calorie goal, which helps you quickly see whether your planned meals are close to your goal.

### 2) Plan meals

Then, set grams for each food group in:

- Breakfast
- Lunch
- Dinner

As you edit grams, PrepMaster recalculates calories, carbs, fats, and protein in real time.

### 3) Prepare meal

In the `Prepare meal` tab, pick the meal you are about to prepare to view a checklist with the amount for each food group. You can also use the substitutions button to swap out food groups. Use the adherence button to track how consistently you've been sticking to your meal plan.

### 4) Shopping list

In the `Shopping list` tab, choose how many days you are shopping for to get a list of how much to buy per food group. It also includes a price tracker to help you find the best deals by comparing the estimated total cost across different stores.
