import React from "react";
import { Utensils } from "lucide-react";
import { FOOD_GROUPS, MEAL_NAMES } from "../data/constants";

const MacroBadge = ({ label, value, colorClass }) => (
  <div
    className={`flex flex-col items-center justify-center p-2 rounded-lg ${colorClass} h-full`}
  >
    <span className='text-sm md:text-xs font-semibold uppercase tracking-wider opacity-70 mb-1'>
      {label}
    </span>
    <span className='text-xl md:text-lg font-bold leading-none flex items-baseline'>
      {Math.round(value)}
      {!label.includes("kCal") && (
        <span className='text-base md:text-sm font-normal ml-0.5'>g</span>
      )}
    </span>
  </div>
);

export default function PlannerTab({
  meals,
  mealTotals,
  handleGramsChange,
  calorieGoal,
  setCalorieGoal,
  dailyTotals,
  kcalPct,
  absKcalDiff,
  kcalDiff,
  isOutsideTolerance,
  carbsPct,
  fatsPct,
  proteinPct,
  authControls,
}) {
  return (
    <div className='space-y-8 flex flex-col items-center'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full'>
        {MEAL_NAMES.map((meal) => (
          <div
            key={meal}
            className='bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col'
          >
            <div className='bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between'>
              <h3 className='font-bold text-xl md:text-lg text-slate-800 flex items-center'>
                <Utensils className='w-4 h-4 mr-2 text-slate-400' />
                {meal}
              </h3>
            </div>

            <div className='flex items-center justify-between px-4 py-3 bg-white border-b border-slate-50 text-sm md:text-xs font-medium text-slate-500'>
              <span className='text-slate-800 font-bold text-lg md:text-base'>
                {Math.round(mealTotals[meal].kCal)} kcal
              </span>
              <div className='flex items-center space-x-3'>
                <span className='text-blue-700'>
                  C: {Math.round(mealTotals[meal].carbs)}
                </span>
                <span className='text-green-700'>
                  F: {Math.round(mealTotals[meal].fats)}
                </span>
                <span className='text-rose-700'>
                  P: {Math.round(mealTotals[meal].protein)}
                </span>
              </div>
            </div>

            <div className='p-2 space-y-1'>
              {FOOD_GROUPS.map((food) => {
                const grams = meals[meal]?.[food.id] || "";
                const isActive = grams > 0;

                return (
                  <div
                    key={food.id}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                      isActive
                        ? "bg-slate-50 border border-slate-100"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className='flex items-center space-x-3'>
                      <div
                        className={`w-3 h-3 rounded-full ${food.color} shadow-sm border border-white`}
                      ></div>
                      <span
                        className={`text-base md:text-sm font-medium ${isActive ? "text-slate-800" : "text-slate-500"}`}
                      >
                        {food.name}
                      </span>
                    </div>

                    <div className='relative flex items-center justify-end w-20'>
                      <input
                        type='number'
                        min='0'
                        step='5'
                        value={grams}
                        onChange={(e) =>
                          handleGramsChange(meal, food.id, e.target.value)
                        }
                        placeholder='0'
                        className={`w-full text-right pr-6 pl-2 py-1.5 rounded-lg border text-base md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          isActive
                            ? "border-slate-300 bg-white text-slate-900"
                            : "border-slate-200 bg-slate-50/50 text-slate-400"
                        }`}
                      />
                      <span className='absolute right-2.5 text-sm md:text-xs text-slate-400 pointer-events-none font-medium'>
                        g
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className='bg-white w-full rounded-2xl shadow-sm border border-slate-100 p-6'>
        <div className='mb-4'>
          <h2 className='text-base md:text-sm font-bold text-slate-600 uppercase tracking-wider'>
            Daily totals
          </h2>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-6'>
          <div className='flex flex-col items-center justify-center p-2 rounded-lg bg-slate-500 shadow-sm border border-slate-500'>
            <span className='text-sm md:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1'>
              kCal Goal
            </span>
            <input
              type='number'
              step='50'
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(Number(e.target.value))}
              className='w-20 text-center px-1 py-0.5 rounded bg-white text-xl md:text-lg font-bold text-slate-800 focus:ring-2 focus:ring-green-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            />
          </div>
          <MacroBadge
            label='kCal Meals'
            value={dailyTotals.kCal}
            colorClass='bg-slate-100 text-slate-800'
          />
          <MacroBadge
            label='Carbs'
            value={dailyTotals.carbs}
            colorClass='bg-blue-50 text-blue-800'
          />
          <MacroBadge
            label='Fats'
            value={dailyTotals.fats}
            colorClass='bg-green-50 text-green-800'
          />
          <MacroBadge
            label='Protein'
            value={dailyTotals.protein}
            colorClass='bg-rose-50 text-rose-800'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100'>
          <div>
            <div className='flex justify-between text-sm md:text-xs mb-1.5'>
              <span className='font-bold text-slate-700'>Calories</span>
            </div>
            <div className='h-3 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-300'>
              <div
                className={`h-full transition-all duration-500 ${isOutsideTolerance ? "bg-orange-400" : "bg-slate-500"}`}
                style={{ width: `${kcalPct}%` }}
              ></div>
            </div>
            <div className='flex justify-start mt-1.5'>
              <span
                className={`text-sm md:text-xs font-medium ${isOutsideTolerance ? "text-orange-500" : "text-slate-500"}`}
              >
                {absKcalDiff === 0
                  ? "Exact goal reached"
                  : `${absKcalDiff} kcal ${kcalDiff > 0 ? "over" : "under"} goal`}
              </span>
            </div>
          </div>

          <div>
            <div className='flex justify-between text-sm md:text-xs mb-1.5'>
              <span className='font-bold text-slate-700'>Macronutrients</span>
            </div>
            <div className='h-3 w-full bg-slate-100 rounded-full overflow-hidden flex'>
              <div
                className='h-full bg-blue-300 transition-all duration-500'
                style={{ width: `${carbsPct}%` }}
                title={`Carbs: ${Math.round(carbsPct)}%`}
              ></div>
              <div
                className='h-full bg-green-300 transition-all duration-500'
                style={{ width: `${fatsPct}%` }}
                title={`Fats: ${Math.round(fatsPct)}%`}
              ></div>
              <div
                className='h-full bg-rose-300 transition-all duration-500'
                style={{ width: `${proteinPct}%` }}
                title={`Protein: ${Math.round(proteinPct)}%`}
              ></div>
            </div>
            <div className='flex justify-between text-sm md:text-xs mt-1.5 px-1'>
              <div className='flex items-center'>
                <span className='font-medium text-blue-700'>
                  <span className='sm:hidden'>C: {Math.round(carbsPct)}%</span>
                  <span className='hidden sm:inline'>
                    {Math.round(carbsPct)}% Carbs
                  </span>
                </span>
              </div>
              <div className='flex items-center'>
                <span className='font-medium text-green-700'>
                  <span className='sm:hidden'>F: {Math.round(fatsPct)}%</span>
                  <span className='hidden sm:inline'>
                    {Math.round(fatsPct)}% Fats
                  </span>
                </span>
              </div>
              <div className='flex items-center'>
                <span className='font-medium text-rose-700/90'>
                  <span className='sm:hidden'>
                    P: {Math.round(proteinPct)}%
                  </span>
                  <span className='hidden sm:inline'>
                    {Math.round(proteinPct)}% Protein
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='w-full flex justify-center'>{authControls}</div>
    </div>
  );
}
