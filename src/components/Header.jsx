import React from "react";
import { Calculator, ShoppingCart, Leaf, ChefHat } from "lucide-react";

export default function Header({ activeTab, setActiveTab, isLoggedIn }) {
  const brandColorClass = isLoggedIn ? "text-green-600" : "text-slate-700";

  return (
    <header className='bg-white border-b sticky top-0 z-10 shadow-sm'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex items-center space-x-2'>
            <Leaf className={`w-6 h-6 ${brandColorClass}`} />
            <h1 className={`text-xl font-bold ${brandColorClass}`}>
              <a
                href='https://github.com/terencicp/meal-prep'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:underline'
              >
                PrepMaster
              </a>
            </h1>
          </div>
          <div className='flex items-center space-x-1 bg-slate-100 p-1 rounded-xl'>
            <button
              onClick={() => setActiveTab("prepare")}
              className={`flex w-11 sm:w-auto items-center justify-center sm:justify-start gap-0 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "prepare"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ChefHat className='w-4 h-4' />
              <span className='hidden sm:inline'>Prepare meal</span>
            </button>
            <button
              onClick={() => setActiveTab("planner")}
              className={`flex w-11 sm:w-auto items-center justify-center sm:justify-start gap-0 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "planner"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Calculator className='w-4 h-4' />
              <span className='hidden sm:inline'>Plan meals</span>
            </button>
            <button
              onClick={() => setActiveTab("shopping")}
              className={`flex w-11 sm:w-auto items-center justify-center sm:justify-start gap-0 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "shopping"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ShoppingCart className='w-4 h-4' />
              <span className='hidden sm:inline'>Shopping list</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
