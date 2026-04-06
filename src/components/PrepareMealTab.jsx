import React from "react";
import { Utensils, CheckCircle2, Circle } from "lucide-react";
import { FOOD_GROUPS, MEAL_NAMES } from "../data/constants";

export default function PrepareMealTab({
  meals,
  mealToPrepare,
  setMealToPrepare,
  checkedItems,
  setCheckedItems,
  toggleCheckItem,
}) {
  return (
    <div className='max-w-lg mx-auto space-y-6 px-3 sm:px-0'>
      <div className='bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'>
        <div className='bg-slate-50 px-2 sm:px-3 py-5 border-b border-slate-200'>
          <div className='bg-slate-100 rounded-2xl p-1.5 sm:p-2 flex gap-1.5 sm:gap-2'>
            {MEAL_NAMES.map((meal) => (
              <button
                key={meal}
                onClick={() => {
                  setMealToPrepare(meal);
                  setCheckedItems({});
                }}
                className={`flex-1 min-w-0 px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-base sm:text-xl font-bold transition-colors text-center whitespace-nowrap ${
                  mealToPrepare === meal
                    ? "bg-white text-green-600 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {meal}
              </button>
            ))}
          </div>
        </div>
        <div className='p-4 divide-y divide-slate-100'>
          {FOOD_GROUPS.filter((food) => meals[mealToPrepare]?.[food.id] > 0)
            .length === 0 ? (
            <div className='p-8 text-center text-slate-500'>
              <Utensils className='w-12 h-12 mx-auto mb-3 text-slate-300' />
              <p>No ingredients planned for {mealToPrepare.toLowerCase()}.</p>
            </div>
          ) : (
            FOOD_GROUPS.filter(
              (food) => meals[mealToPrepare]?.[food.id] > 0,
            ).map((food) => {
              const amount = meals[mealToPrepare][food.id];
              const isChecked = checkedItems[food.id];
              return (
                <div
                  key={food.id}
                  onClick={() => toggleCheckItem(food.id)}
                  className={`flex items-center justify-between px-3 sm:px-4 py-4 cursor-pointer transition-colors hover:bg-slate-50 ${isChecked ? "opacity-50" : ""}`}
                >
                  <div className='flex items-center space-x-4'>
                    {isChecked ? (
                      <CheckCircle2
                        className={`w-6 h-6 ${food.iconColor} opacity-60`}
                      />
                    ) : (
                      <Circle
                        className={`w-6 h-6 ${food.iconColor} opacity-50`}
                      />
                    )}
                    <span
                      className={`text-lg font-medium ${isChecked ? "line-through text-slate-500" : "text-slate-800"}`}
                    >
                      {food.name}
                    </span>
                  </div>
                  <span
                    className={`text-xl font-bold ${isChecked ? "line-through text-slate-400" : "text-slate-700"}`}
                  >
                    {amount}
                    <span className='text-sm font-medium ml-1'>g</span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
