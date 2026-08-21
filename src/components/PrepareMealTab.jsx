import React from "react";
import {
  Utensils,
  CheckCircle2,
  Circle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { MEAL_NAMES } from "../data/constants";
import { buildFoodGroupMap } from "../data/foodGroups";

export default function PrepareMealTab({
  meals,
  mealToPrepare,
  setMealToPrepare,
  checkedItems,
  foodGroups,
  allFoodGroups,
  substitutions,
  isSubstitutionMode,
  selectedSubstitutionAnchors,
  toggleCheckRow,
  toggleSubstitutionRowSelection,
  onSubstituteFoodButtonClick,
  setActiveTab,
  trackerLast30DaysPercent,
}) {
  // Rows come from the visible groups, but a substitution can point at a hidden
  // group, so names and calories are looked up in the plan's whole catalog.
  const foodGroupById = buildFoodGroupMap(allFoodGroups || foodGroups);

  const subByAnchor = new Map();
  const sourceIdsInSubs = new Set();
  substitutions.forEach((sub) => {
    // A substitution whose replacement or sources no longer exist is ignored,
    // so the row falls back to the original food instead of disappearing.
    if (!foodGroupById[sub.replacementFoodId]) {
      return;
    }
    if (!sub.sourceIds.every((id) => foodGroupById[id])) {
      return;
    }
    subByAnchor.set(sub.anchorFoodId, sub);
    sub.sourceIds.forEach((id) => sourceIdsInSubs.add(id));
  });

  const mealFoods = meals[mealToPrepare] || {};
  const displayRows = [];
  foodGroups.forEach((food) => {
    const amount = mealFoods[food.id] || 0;
    if (amount <= 0) {
      return;
    }

    const sub = subByAnchor.get(food.id);
    if (sub) {
      const replacement = foodGroupById[sub.replacementFoodId];
      if (!replacement) {
        return;
      }
      const totalCalories = sub.sourceIds.reduce((sum, sourceId) => {
        const sourceFood = foodGroupById[sourceId];
        const sourceGrams = mealFoods[sourceId] || 0;
        if (!sourceFood) return sum;
        return sum + (sourceGrams * sourceFood.kCal) / 100;
      }, 0);
      const replacementGrams =
        replacement.kCal > 0
          ? Math.round((totalCalories * 100) / replacement.kCal)
          : 0;
      const isChecked = sub.sourceIds.every((id) => Boolean(checkedItems[id]));
      displayRows.push({
        anchorFoodId: food.id,
        displayName: replacement.name,
        displayAmount: replacementGrams,
        isChecked,
        sourceIds: sub.sourceIds,
        isSubstituted: true,
      });
      return;
    }

    if (sourceIdsInSubs.has(food.id)) {
      return;
    }

    displayRows.push({
      anchorFoodId: food.id,
      displayName: food.name,
      displayAmount: amount,
      isChecked: Boolean(checkedItems[food.id]),
      sourceIds: [food.id],
      isSubstituted: false,
    });
  });

  const handleRowClick = (row) => {
    if (isSubstitutionMode) {
      if (row.isChecked) {
        return;
      }
      toggleSubstitutionRowSelection(row.anchorFoodId);
      return;
    }
    toggleCheckRow(row.sourceIds);
  };

  const hasMealItems = displayRows.length > 0;

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
            displayRows.map((row) => {
              const isSelected =
                isSubstitutionMode &&
                selectedSubstitutionAnchors.includes(row.anchorFoodId);
              const isCheckedDisabledForSub =
                isSubstitutionMode && row.isChecked;

              const rowBg = row.isChecked
                ? "bg-white opacity-60"
                : isSelected
                  ? "bg-[#FFD600]"
                  : isSubstitutionMode
                    ? "bg-[#FFF4B3] hover:bg-[#FFE35C]"
                    : "bg-[#FFFBE6] hover:bg-[#FFF176]";

              return (
                <div
                  key={row.anchorFoodId}
                  onClick={() => handleRowClick(row)}
                  className={`flex items-center justify-between px-4 py-4 border-b-4 border-black transition-colors ${rowBg} ${
                    isCheckedDisabledForSub
                      ? "cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <div className='flex items-center'>
                    <span
                      className={`flex items-center justify-center overflow-hidden transition-all duration-300 ease-out ${
                        isSubstitutionMode
                          ? "w-0 mr-0 opacity-0"
                          : "w-6 mr-4 opacity-100"
                      }`}
                      aria-hidden='true'
                    >
                      {row.isChecked ? (
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
                    <div className='flex items-center gap-1.5'>
                      <span
                        className={`text-lg font-black uppercase tracking-wide ${
                          row.isChecked
                            ? "line-through decoration-[3px] decoration-black text-black"
                            : "text-black"
                        }`}
                      >
                        {row.displayName}
                      </span>
                      {(row.isSubstituted || isSelected) && (
                        <span
                          className='inline-flex items-center text-black/80 ml-1'
                          title={
                            isSelected
                              ? "Selected for substitution"
                              : "Replaced"
                          }
                          aria-label={
                            isSelected
                              ? "Selected for substitution"
                              : "Replaced"
                          }
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
                      row.isChecked
                        ? "line-through decoration-[3px] decoration-black text-black"
                        : "text-black"
                    }`}
                  >
                    {row.displayAmount}
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
            onClick={onSubstituteFoodButtonClick}
            className={`w-50 px-5 py-3 sm:py-3 border-4 border-black text-sm sm:text-sm font-black uppercase tracking-wide transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none ${
              isSubstitutionMode
                ? selectedSubstitutionAnchors.length > 0
                  ? "bg-[#FFD600] text-black"
                  : "bg-[#FFF4B3] text-black"
                : "bg-white text-black hover:bg-[#FFF176]"
            }`}
          >
            Substitute food
          </button>
        </div>
      )}

      <div className='mt-10'>
        <button
          onClick={() => setActiveTab("tracker")}
          className='w-full max-w-xs mx-auto bg-black text-white px-4 py-3 border-4 border-black border-b-[6px] border-r-[6px] border-[#FFD600] flex justify-between items-center transition-transform hover:translate-x-1 hover:translate-y-1 hover:border-b-4 hover:border-r-4 relative z-10'
          style={{ boxShadow: "-4px 4px 0px 0px #FFD600" }}
        >
          <div className='flex flex-col text-left'>
            <span className='font-black text-xl uppercase tracking-wide'>
              Adherence
            </span>
            <span className='text-[#FFD600] font-black text-sm tracking-wide mt-1'>
              {trackerLast30DaysPercent}% LAST 30 DAYS
            </span>
          </div>
          <div className='bg-[#FFD600] rounded-full p-2 border-2 border-black flex items-center justify-center'>
            <ArrowRight className='w-6 h-6 text-black' strokeWidth={3} />
          </div>
        </button>
      </div>
    </div>
  );
}
