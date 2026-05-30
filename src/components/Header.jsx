import React from "react";
import { Calculator, ShoppingCart, ChefHat } from "lucide-react";

export default function Header({
  activeTab,
  setActiveTab,
  isLoggedIn,
  hasActiveSavedPlan,
}) {
  const logoContainerClass =
    isLoggedIn && hasActiveSavedPlan
      ? "w-12 h-12 border-4 border-black bg-[#FFD600] text-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      : "w-12 h-12 border-4 border-black bg-black text-white flex items-center justify-center shadow-[4px_4px_0px_0px_#FFD600]";

  const tabBaseClass =
    "flex flex-1 sm:flex-none sm:w-auto flex-row items-center justify-center sm:justify-start gap-2 px-2 sm:px-5 py-2.5 border-4 border-black text-sm sm:text-sm font-black uppercase tracking-wide leading-none transition-transform";

  return (
    <header className='bg-white border-b-4 border-black sticky top-0 z-20'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 py-3'>
        <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
          <div className='hidden sm:flex items-center gap-3'>
            <div className={logoContainerClass}>
              <ChefHat className='w-8 h-8' strokeWidth={2.75} />
            </div>
            <h1 className='font-logo text-3xl sm:text-4xl leading-none uppercase text-black h-12 flex items-center translate-y-0.5'>
              <a
                href='https://github.com/terencicp/meal-prep'
                target='_blank'
                rel='noopener noreferrer'
                className='block hover:underline'
              >
                PrepMaster
              </a>
            </h1>
          </div>

          <div className='flex w-full sm:w-auto items-center gap-2 sm:gap-3 flex-nowrap justify-center'>
            <button
              onClick={() => setActiveTab("prepare")}
              className={`${tabBaseClass} ${
                activeTab === "prepare"
                  ? "bg-[#FFD600] text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              <ChefHat className='w-6 h-6 sm:w-4 sm:h-4' strokeWidth={2.6} />
              <span className='sm:hidden'>Prep</span>
              <span className='hidden sm:inline'>Prep meal</span>
            </button>
            <button
              onClick={() => setActiveTab("planner")}
              className={`${tabBaseClass} ${
                activeTab === "planner"
                  ? "bg-[#FFD600] text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              <Calculator className='w-6 h-6 sm:w-4 sm:h-4' strokeWidth={2.6} />
              <span className='sm:hidden'>Meals</span>
              <span className='hidden sm:inline'>Plan meals</span>
            </button>
            <button
              onClick={() => setActiveTab("shopping")}
              className={`${tabBaseClass} ${
                activeTab === "shopping"
                  ? "bg-[#FFD600] text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
                  : "bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              <ShoppingCart
                className='w-6 h-6 sm:w-4 sm:h-4'
                strokeWidth={2.6}
              />
              <span className='sm:hidden'>Shop</span>
              <span className='hidden sm:inline'>Shopping</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
