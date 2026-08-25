import React from "react";
import { CookingPot, CheckCircle2, Circle } from "lucide-react";

export default function PrepTab({
  dailyFoodTotals,
  cookDays,
  setCookDays,
  cookedItems,
  toggleCookedItem,
}) {
  const hasFood = dailyFoodTotals.length > 0;

  return (
    <div className='w-full max-w-116 mx-auto px-3 sm:px-0'>
      <div className='bg-white border-4 border-black shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] overflow-hidden'>
        <div className='bg-[#FFD600] px-4 py-4 border-b-4 border-black'>
          <div className='flex items-center justify-between gap-3'>
            <h3 className='text-lg font-black uppercase tracking-wide text-black whitespace-nowrap'>
              <span className='sm:hidden'>Cook</span>
              <span className='hidden sm:inline'>Cook for</span>
            </h3>
            <div className='flex items-center'>
              <button
                onClick={() => setCookDays((days) => Math.max(1, days - 1))}
                className='w-10 h-10 flex items-center justify-center border-4 border-black bg-white text-black font-black text-xl hover:bg-[#FFF176] transition-colors'
                aria-label='One day less'
              >
                -
              </button>
              <span className='w-24 text-center font-black text-lg uppercase tracking-wide text-black'>
                {cookDays} {cookDays === 1 ? "day" : "days"}
              </span>
              <button
                onClick={() => setCookDays((days) => days + 1)}
                className='w-10 h-10 flex items-center justify-center border-4 border-black bg-white text-black font-black text-xl hover:bg-[#FFF176] transition-colors'
                aria-label='One day more'
              >
                +
              </button>
            </div>
          </div>
        </div>
        <div className='p-0'>
          {!hasFood ? (
            <div className='px-6 py-10 text-center text-black'>
              <CookingPot className='w-12 h-12 mx-auto mb-3 text-black' />
              <p className='font-bold uppercase tracking-wide text-sm'>
                No ingredients planned yet.
              </p>
            </div>
          ) : (
            dailyFoodTotals.map((food) => {
              const isCooked = Boolean(cookedItems[food.id]);
              const cookGrams = Math.round(food.dailyRawGrams * cookDays);
              const strikeThrough = isCooked
                ? "line-through decoration-[3px] decoration-black text-black"
                : "text-black";

              return (
                <div
                  key={food.id}
                  onClick={() => toggleCookedItem(food.id)}
                  className={`flex items-center justify-between px-4 py-4 border-b-4 border-black cursor-pointer transition-colors ${
                    isCooked
                      ? "bg-white opacity-60"
                      : "bg-[#FFFBE6] hover:bg-[#FFF176]"
                  }`}
                >
                  <div className='flex items-center'>
                    <span
                      className='flex items-center justify-center w-6 mr-4'
                      aria-hidden='true'
                    >
                      {isCooked ? (
                        <CheckCircle2
                          className='w-6 h-6 text-black shrink-0'
                          strokeWidth={2.8}
                        />
                      ) : (
                        <Circle
                          className='w-6 h-6 text-black shrink-0'
                          strokeWidth={2.8}
                        />
                      )}
                    </span>
                    <span
                      className={`text-lg font-black uppercase tracking-wide ${strikeThrough}`}
                    >
                      {food.name}
                    </span>
                  </div>
                  <span className={`text-xl font-black ${strikeThrough}`}>
                    {cookGrams}
                    <span className='text-sm font-bold ml-1'>g</span>
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
