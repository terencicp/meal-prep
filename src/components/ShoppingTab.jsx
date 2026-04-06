import React from "react";
import { CalendarDays, ShoppingCart, CheckCircle2, Circle } from "lucide-react";

const EGG_WEIGHT_GRAMS = 50;

function formatShoppingAmount(item) {
  const totalGrams = item.finalAmountKg * 1000;

  if (item.id === "eggs") {
    return {
      value: Math.ceil(totalGrams / EGG_WEIGHT_GRAMS),
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
    <div className='max-w-lg mx-auto space-y-6 px-3 sm:px-0'>
      <div className='bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'>
        <div className='bg-slate-50 px-6 py-4 border-b border-slate-200'>
          <h3 className='font-bold text-slate-800'>Shopping list</h3>
        </div>
        <div className='divide-y divide-slate-100'>
          {shoppingList.length === 0 ? (
            <div className='p-8 text-center text-slate-500'>
              <ShoppingCart className='w-12 h-12 mx-auto mb-3 text-slate-300' />
              <p>Your meal planner is empty.</p>
              <button
                onClick={() => setActiveTab("planner")}
                className='mt-4 text-green-600 font-medium hover:underline'
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
                  className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors hover:bg-slate-50 ${isChecked ? "opacity-50" : ""}`}
                >
                  <div className='flex items-center space-x-4'>
                    {isChecked ? (
                      <CheckCircle2
                        className={`w-6 h-6 ${item.iconColor} opacity-60`}
                      />
                    ) : (
                      <Circle
                        className={`w-6 h-6 ${item.iconColor} opacity-50`}
                      />
                    )}
                    <span
                      className={`text-lg font-medium ${isChecked ? "line-through text-slate-500" : "text-slate-800"}`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`text-xl font-bold ${isChecked ? "line-through text-slate-400" : "text-slate-700"}`}
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

      <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h2 className='text-lg font-bold text-slate-800 flex items-center'>
              <CalendarDays className='w-5 h-5 mr-2 text-green-600' />
              Days
            </h2>
            <p className='text-sm text-slate-500 mt-1'>
              How many days are you shopping for?
            </p>
          </div>
          <div className='flex items-center bg-slate-100 rounded-lg p-1 w-fit'>
            <button
              onClick={() => setPrepDays(Math.max(1, prepDays - 1))}
              className='w-10 h-10 flex items-center justify-center rounded-md bg-white shadow-sm text-slate-600 hover:text-slate-900'
            >
              -
            </button>
            <span className='w-16 text-center font-bold text-lg'>
              {prepDays}
            </span>
            <button
              onClick={() => setPrepDays(prepDays + 1)}
              className='w-10 h-10 flex items-center justify-center rounded-md bg-white shadow-sm text-slate-600 hover:text-slate-900'
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
