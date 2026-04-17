import React from "react";
import { Utensils, CheckCircle2, Circle, RefreshCw } from "lucide-react";
import { FOOD_GROUPS, MEAL_NAMES } from "../data/constants";

export default function PrepareMealTab({
  meals,
  mealToPrepare,
  setMealToPrepare,
  checkedItems,
  substitutions,
  isSubstitutionMode,
  setIsSubstitutionMode,
  toggleCheckItem,
  openSubstitutionModal,
}) {
  const foodGroupById = FOOD_GROUPS.reduce((acc, food) => {
    acc[food.id] = food;
    return acc;
  }, {});

  const handleRowClick = (foodId) => {
    if (isSubstitutionMode) {
      openSubstitutionModal(mealToPrepare, foodId);
      return;
    }

    toggleCheckItem(foodId);
  };

  const hasMealItems =
    FOOD_GROUPS.filter((food) => meals[mealToPrepare]?.[food.id] > 0).length >
    0;

  return (
    <div className='w-full max-w-116 mx-auto px-3 sm:px-0'>
      <div className='bg-white border-4 border-black shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] overflow-hidden'>
        <div className='bg-[#FFD600] px-3 py-4 border-b-4 border-black'>
          <div className='grid grid-cols-3 gap-2'>
            {MEAL_NAMES.map((meal) => (
              <button
                key={meal}
                onClick={() => {
                  setMealToPrepare(meal);
                }}
                className={`min-w-0 px-2 py-2 sm:py-3 border-4 border-black text-base sm:text-lg font-black uppercase tracking-wide transition-colors text-center whitespace-nowrap ${
                  mealToPrepare === meal
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-[#FFF176]"
                }`}
              >
                {meal.toLowerCase() === "breakfast" ? (
                  <>
                    <span className='sm:hidden'>BREAK</span>
                    <span className='hidden sm:inline'>{meal}</span>
                  </>
                ) : (
                  meal
                )}
              </button>
            ))}
          </div>
        </div>
        <div className='p-0'>
          {!hasMealItems ? (
            <div className='px-6 py-10 text-center text-black'>
              <Utensils className='w-12 h-12 mx-auto mb-3 text-black' />
              <p className='font-bold uppercase tracking-wide text-sm'>
                No ingredients planned for {mealToPrepare.toLowerCase()}.
              </p>
            </div>
          ) : (
            FOOD_GROUPS.filter(
              (food) => meals[mealToPrepare]?.[food.id] > 0,
            ).map((food) => {
              const amount = meals[mealToPrepare][food.id];
              const isChecked = checkedItems[food.id];
              const substitutionFood = substitutions[food.id]
                ? foodGroupById[substitutions[food.id]]
                : null;
              const substituteAmount = substitutionFood
                ? Math.round((amount * food.kCal) / substitutionFood.kCal)
                : amount;
              const displayName = substitutionFood
                ? substitutionFood.name
                : food.name;
              const displayAmount = Number.isFinite(substituteAmount)
                ? substituteAmount
                : amount;

              return (
                <div
                  key={food.id}
                  onClick={() => handleRowClick(food.id)}
                  className={`flex items-center justify-between px-4 py-4 cursor-pointer border-b-4 border-black transition-colors ${
                    isChecked
                      ? "bg-white opacity-60"
                      : isSubstitutionMode
                        ? "bg-[#FFF4B3] hover:bg-[#FFE35C]"
                        : "bg-[#FFFBE6] hover:bg-[#FFF176]"
                  }`}
                >
                  <div className='flex items-center gap-4'>
                    {isChecked ? (
                      <CheckCircle2
                        className='w-6 h-6 text-black'
                        strokeWidth={2.8}
                      />
                    ) : (
                      <Circle
                        className='w-6 h-6 text-black'
                        strokeWidth={2.8}
                      />
                    )}
                    <div className='flex items-center gap-1.5'>
                      <span
                        className={`text-lg font-black uppercase tracking-wide ${
                          isChecked
                            ? "line-through decoration-[3px] decoration-black text-black"
                            : "text-black"
                        }`}
                      >
                        {displayName}
                      </span>
                      {substitutionFood && (
                        <span
                          className='inline-flex items-center text-black/80 ml-1'
                          title='Replaced'
                          aria-label='Replaced'
                        >
                          <RefreshCw
                            className='w-3.5 h-3.5 sm:w-4 sm:h-4'
                            strokeWidth={2.5}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xl font-black ${
                      isChecked
                        ? "line-through decoration-[3px] decoration-black text-black"
                        : "text-black"
                    }`}
                  >
                    {displayAmount}
                    <span className='text-sm font-bold ml-1'>g</span>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {hasMealItems && (
        <div className='mt-6 flex justify-center'>
          <button
            type='button'
            onClick={() => setIsSubstitutionMode((prev) => !prev)}
            className={`w-64 sm:w-64 px-5 py-3 sm:py-3 border-4 border-black text-sm sm:text-sm font-black uppercase tracking-wide transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${
              isSubstitutionMode
                ? "bg-[#FFD600] text-black"
                : "bg-white text-black hover:bg-[#FFF176]"
            }`}
          >
            {isSubstitutionMode ? "CANCEL SUBSTITUTION" : "Substitute food"}
          </button>
        </div>
      )}
    </div>
  );
}
