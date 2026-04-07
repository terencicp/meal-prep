import React from "react";
import { FOOD_GROUPS, MEAL_NAMES } from "../data/constants";

const MacroBadge = ({ label, value, colorClass, textClass = "text-black" }) => (
  <div
    className={`flex flex-col items-center justify-center px-3 py-2 md:py-3 border-4 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] ${colorClass} ${textClass}`}
  >
    <span className='text-xs font-black uppercase tracking-wide mb-1'>
      {label}
    </span>
    <span className='text-2xl md:text-2xl font-black leading-none flex items-baseline'>
      {Math.round(value)}
      {!label.includes("kCal") && (
        <span className='text-sm md:text-sm font-bold ml-1'>g</span>
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
  activeMealPlanName,
  authControls,
}) {
  const handleSelectInputContent = (event) => {
    // Delay selection slightly so mobile browsers finish placing focus first.
    requestAnimationFrame(() => {
      event.target.select();
    });
  };

  return (
    <div className='space-y-8 w-full'>
      <div className='bg-white w-full border-4 border-black px-4 pb-4 pt-3 md:px-7 md:pb-7 md:pt-5 shadow-[7px_7px_0px_0px_rgba(0,0,0,1)]'>
        <div className='mb-3 md:mb-5'>
          <h2 className='text-2xl md:text-2xl font-black uppercase tracking-wide'>
            Daily totals
          </h2>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-5 mb-4 md:mb-8'>
          <div className='col-span-2 md:col-span-1 bg-black text-white border-4 border-black px-3 py-2 md:py-3 shadow-[5px_5px_0px_0px_#FFD600]'>
            <span className='text-xs font-black uppercase tracking-wide mb-1 block text-center'>
              kCal Goal
            </span>
            <input
              type='number'
              step='50'
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(Number(e.target.value))}
              onFocus={handleSelectInputContent}
              onClick={handleSelectInputContent}
              className='w-full text-center px-2 py-1 border-4 border-black bg-white text-2xl md:text-xl font-black text-black focus:outline-none focus:bg-[#FFD600] focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            />
          </div>
          <MacroBadge
            label='kCal Meals'
            value={dailyTotals.kCal}
            colorClass='bg-white'
          />
          <MacroBadge
            label='Carbs'
            value={dailyTotals.carbs}
            colorClass='bg-[#0055FF]'
            textClass='text-white'
          />
          <MacroBadge
            label='Fats'
            value={dailyTotals.fats}
            colorClass='bg-[#00E676]'
          />
          <MacroBadge
            label='Protein'
            value={dailyTotals.protein}
            colorClass='bg-[#FF2A5F]'
            textClass='text-white'
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8'>
          <div>
            <div className='flex justify-between text-base md:text-sm mb-0 md:mb-2'>
              <span className='font-black uppercase tracking-wide'>
                Calories
              </span>
            </div>
            <div className='h-8 w-full bg-white overflow-hidden flex border-4 border-black'>
              <div
                className={`h-full border-r-4 border-black transition-all duration-500 ${isOutsideTolerance ? "bg-[#FFD600]" : "bg-black"}`}
                style={{ width: `${kcalPct}%` }}
              ></div>
            </div>
            <div className='hidden md:flex justify-start mt-1 md:mt-2'>
              <span
                className={`text-sm md:text-xs font-black uppercase tracking-wide ${isOutsideTolerance ? "text-[#B29500]" : "text-slate-600"}`}
              >
                {absKcalDiff === 0
                  ? "Exact goal reached"
                  : `${absKcalDiff} kcal ${kcalDiff > 0 ? "over" : "under"} goal`}
              </span>
            </div>
          </div>

          <div className='mt-2 md:mt-0'>
            <div className='flex justify-between text-base md:text-sm mb-0 md:mb-2'>
              <span className='font-black uppercase tracking-wide'>
                Macronutrients
              </span>
            </div>
            <div className='h-8 w-full bg-white overflow-hidden flex border-4 border-black'>
              <div
                className='h-full bg-[#0055FF] border-r-4 border-black transition-all duration-500'
                style={{ width: `${carbsPct}%` }}
                title={`Carbs: ${Math.round(carbsPct)}%`}
              ></div>
              <div
                className='h-full bg-[#00E676] border-r-4 border-black transition-all duration-500'
                style={{ width: `${fatsPct}%` }}
                title={`Fats: ${Math.round(fatsPct)}%`}
              ></div>
              <div
                className='h-full bg-[#FF2A5F] transition-all duration-500'
                style={{ width: `${proteinPct}%` }}
                title={`Protein: ${Math.round(proteinPct)}%`}
              ></div>
            </div>
            <div className='hidden md:flex justify-between text-sm md:text-xs mt-1 md:mt-2'>
              <div className='flex items-center'>
                <span className='font-black uppercase text-[#0055FF]'>
                  <span className='sm:hidden'>C: {Math.round(carbsPct)}%</span>
                  <span className='hidden sm:inline'>
                    {Math.round(carbsPct)}% Carbs
                  </span>
                </span>
              </div>
              <div className='flex items-center'>
                <span className='font-black uppercase text-[#00994D]'>
                  <span className='sm:hidden'>F: {Math.round(fatsPct)}%</span>
                  <span className='hidden sm:inline'>
                    {Math.round(fatsPct)}% Fats
                  </span>
                </span>
              </div>
              <div className='flex items-center'>
                <span className='font-black uppercase text-[#FF2A5F]'>
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

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 w-full'>
        {MEAL_NAMES.map((meal) => {
          const mealCarbs = Math.max(0, mealTotals[meal].carbs);
          const mealFats = Math.max(0, mealTotals[meal].fats);
          const mealProtein = Math.max(0, mealTotals[meal].protein);
          const totalMacros = Math.max(1, mealCarbs + mealFats + mealProtein);

          return (
            <div
              key={meal}
              className='bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col'
            >
              <div className='border-b-4 border-black px-4 py-4 bg-[#FFD600]'>
                <div className='mb-1'>
                  <h3 className='font-black text-2xl md:text-2xl uppercase tracking-wide'>
                    {meal}
                  </h3>
                </div>

                <div className='flex items-center justify-between mt-2'>
                  <span className='font-black text-2xl md:text-2xl leading-none'>
                    {Math.round(mealTotals[meal].kCal)}
                    <span className='text-base md:text-base ml-1'>kcal</span>
                  </span>
                  <div className='h-4 w-24 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex'>
                    <div
                      className='h-full bg-[#0055FF] border-r-2 border-black'
                      style={{ width: `${(mealCarbs / totalMacros) * 100}%` }}
                    ></div>
                    <div
                      className='h-full bg-[#00E676] border-r-2 border-black'
                      style={{ width: `${(mealFats / totalMacros) * 100}%` }}
                    ></div>
                    <div
                      className='h-full bg-[#FF2A5F]'
                      style={{ width: `${(mealProtein / totalMacros) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className='px-4 py-3 space-y-2'>
                {FOOD_GROUPS.map((food) => {
                  const grams = meals[meal]?.[food.id] || "";
                  const isActive = grams > 0;

                  return (
                    <div
                      key={food.id}
                      className={`flex items-center justify-between text-black ${isActive ? "opacity-100" : "opacity-40 hover:opacity-80"}`}
                    >
                      <span className='font-bold uppercase tracking-wide text-xl md:text-xl text-black'>
                        {food.name}
                      </span>

                      <div className='relative flex items-center justify-end w-20'>
                        <input
                          type='number'
                          min='0'
                          step='5'
                          value={grams}
                          onChange={(e) =>
                            handleGramsChange(meal, food.id, e.target.value)
                          }
                          onFocus={handleSelectInputContent}
                          onClick={handleSelectInputContent}
                          placeholder='0'
                          className='w-full text-right pr-6 pl-2 py-1 border-[3px] border-black bg-white text-base md:text-lg font-bold text-black placeholder:text-black focus:outline-none focus:bg-[#FFD600] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                        />
                        <span className='absolute right-2 text-sm md:text-base text-black pointer-events-none font-bold'>
                          g
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className='w-full flex flex-col items-center gap-3 pt-1'>
        {activeMealPlanName && (
          <p className='text-base md:text-lg font-black uppercase tracking-wide text-black'>
            Meal plan: {activeMealPlanName}
          </p>
        )}
        <div className='w-full flex justify-center'>{authControls}</div>
      </div>
    </div>
  );
}
