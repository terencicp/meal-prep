import React from "react";
import {
  Calculator,
  ShoppingCart,
  ChefHat,
  CookingPot,
  Utensils,
} from "lucide-react";

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
    "flex flex-1 sm:flex-none sm:w-auto flex-row items-center justify-center sm:justify-start gap-0 sm:gap-2 px-2 sm:px-5 py-2.5 border-4 border-black text-sm sm:text-sm font-black uppercase tracking-wide leading-none transition-transform";

  const tabStateClass = (tabName) =>
    activeTab === tabName
      ? "bg-[#FFD600] text-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]"
      : "bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]";

  const TABS = [
    { name: "planner", label: "Meals", Icon: Calculator },
    { name: "prep", label: "Prep", Icon: CookingPot },
    { name: "eat", label: "Eat", Icon: Utensils },
    { name: "shopping", label: "Shop", Icon: ShoppingCart },
  ];

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
            {TABS.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                aria-label={tab.label}
                className={`${tabBaseClass} ${tabStateClass(tab.name)}`}
              >
                <tab.Icon className='w-6 h-6 sm:w-4 sm:h-4' strokeWidth={2.6} />
                <span className='hidden sm:inline'>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
