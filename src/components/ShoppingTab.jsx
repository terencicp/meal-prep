import React from "react";
import { CalendarDays, ShoppingCart, CheckCircle2, Circle } from "lucide-react";

const EGG_WEIGHT_GRAMS = 50;
const YOGURT_WEIGHT_GRAMS = 120;

function formatShoppingAmount(item) {
  const totalGrams = item.finalAmountKg * 1000;

  if (item.id === "eggs") {
    return {
      value: Math.ceil(totalGrams / EGG_WEIGHT_GRAMS),
      unit: "",
    };
  }

  if (item.id === "yogurt") {
    return {
      value: Math.ceil(totalGrams / YOGURT_WEIGHT_GRAMS),
      unit: "",
    };
  }

  if (item.finalAmountKg < 1) {
    return {
      value: Math.ceil(totalGrams),
      unit: "g",
    };
  }

  return {
    value: (Math.ceil(item.finalAmountKg * 10) / 10).toFixed(1),
    unit: "kg",
  };
}

export default function ShoppingTab({
  prepDays,
  setPrepDays,
  shoppingList,
  checkedShoppingItems,
  toggleShoppingItem,
  setActiveTab,
}) {
  return (
    <div className='w-full max-w-md mx-auto space-y-5 px-3 sm:px-0'>
      <div className='bg-white border-4 border-black shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] overflow-hidden'>
        <div className='bg-[#FFD600] px-4 py-4 border-b-4 border-black'>
          <h3 className='font-black uppercase tracking-wide text-black'>
            Shopping List
          </h3>
        </div>
        <div className='p-0'>
          {shoppingList.length === 0 ? (
            <div className='px-6 py-10 text-center text-black'>
              <ShoppingCart className='w-12 h-12 mx-auto mb-3 text-black' />
              <p className='font-bold uppercase tracking-wide text-sm'>
                Your meal planner is empty.
              </p>
              <button
                onClick={() => setActiveTab("planner")}
                className='mt-5 px-4 py-2 border-4 border-black bg-white text-black font-black uppercase tracking-wide hover:bg-[#FFF176] transition-colors'
              >
                Go add some meals
              </button>
            </div>
          ) : (
            shoppingList.map((item) => {
              const isChecked = checkedShoppingItems[item.id];
              const formattedAmount = formatShoppingAmount(item);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleShoppingItem(item.id)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b-4 border-black transition-colors ${
                    isChecked
                      ? "bg-white opacity-60"
                      : "bg-[#FFFBE6] hover:bg-[#FFF176]"
                  }`}
                >
                  <div className='flex items-center space-x-3'>
                    {isChecked ? (
                      <CheckCircle2
                        className='w-5 h-5 text-black'
                        strokeWidth={2.8}
                      />
                    ) : (
                      <Circle
                        className='w-5 h-5 text-black'
                        strokeWidth={2.8}
                      />
                    )}
                    <span
                      className={`text-base font-black uppercase tracking-wide ${
                        isChecked
                          ? "line-through decoration-[3px] decoration-black text-black"
                          : "text-black"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`text-lg font-black ${
                      isChecked
                        ? "line-through decoration-[3px] decoration-black text-black"
                        : "text-black"
                    }`}
                  >
                    {formattedAmount.value}
                    {formattedAmount.unit ? (
                      <span className='font-bold ml-1'>
                        {formattedAmount.unit}
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className='bg-white border-4 border-black shadow-[7px_7px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h2 className='text-lg font-black uppercase tracking-wide text-black flex items-center'>
              <CalendarDays
                className='w-5 h-5 mr-2 text-black'
                strokeWidth={2.8}
              />
              Days
            </h2>
            <p className='text-sm text-black mt-1 font-bold'>
              How many days are you shopping for?
            </p>
          </div>
          <div className='flex items-center p-1 w-fit'>
            <button
              onClick={() => setPrepDays(Math.max(1, prepDays - 1))}
              className='w-10 h-10 flex items-center justify-center border-4 border-black bg-white text-black font-black text-xl hover:bg-[#FFF176] transition-colors'
            >
              -
            </button>
            <span className='w-12 text-center font-black text-xl text-black'>
              {prepDays}
            </span>
            <button
              onClick={() => setPrepDays(prepDays + 1)}
              className='w-10 h-10 flex items-center justify-center border-4 border-black bg-white text-black font-black text-xl hover:bg-[#FFF176] transition-colors'
            >
              +
            </button>
          </div>
        </div>
      </div>

      <p className='text-xs text-slate-500 text-center px-2 font-bold'>
        A yogurt is 120 grams, an egg is 50 grams.
      </p>
    </div>
  );
}
