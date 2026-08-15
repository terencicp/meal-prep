import React, { useMemo } from "react";
import { X } from "lucide-react";
import { buildFoodGroupMap } from "../data/foodGroups";

export default function SubstitutionsModal({
  isOpen,
  mealName,
  foodGroups,
  sources,
  restoreInfo,
  onClose,
  onApplySubstitution,
  onRestoreSubstitution,
}) {
  const foodGroupById = useMemo(
    () => buildFoodGroupMap(foodGroups),
    [foodGroups],
  );

  const resolvedSources = useMemo(() => {
    if (!Array.isArray(sources)) {
      return [];
    }
    return sources
      .map((source) => {
        const food = foodGroupById[source.foodId];
        if (!food) return null;
        return { food, grams: source.grams };
      })
      .filter(Boolean);
  }, [sources, foodGroupById]);

  const targetCalories = useMemo(() => {
    return resolvedSources.reduce((sum, { food, grams }) => {
      if (!Number.isFinite(grams) || grams <= 0) return sum;
      return sum + (grams / 100) * food.kCal;
    }, 0);
  }, [resolvedSources]);

  const sourceIdSet = useMemo(() => {
    return new Set(resolvedSources.map((s) => s.food.id));
  }, [resolvedSources]);

  const restoreRow = useMemo(() => {
    if (!restoreInfo) return null;
    const names = restoreInfo.sourceIds
      .map((id) => foodGroupById[id]?.name)
      .filter(Boolean);
    if (names.length === 0) return null;
    return { names };
  }, [restoreInfo, foodGroupById]);

  const candidateRows = useMemo(() => {
    if (resolvedSources.length === 0 || targetCalories <= 0) {
      return [];
    }
    const candidates =
      resolvedSources.length === 1
        ? foodGroups.filter((food) => !sourceIdSet.has(food.id))
        : foodGroups;
    return candidates.map((food) => ({
      id: food.id,
      name: food.name,
      grams:
        food.kCal > 0 ? Math.round((targetCalories * 100) / food.kCal) : 0,
    }));
  }, [resolvedSources, sourceIdSet, targetCalories, foodGroups]);

  if (!isOpen || resolvedSources.length === 0) {
    return null;
  }

  const headerSubtitle = resolvedSources
    .map(({ food, grams }) => `${food.name} ${grams}g`)
    .join(" + ");

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4'>
      <button
        type='button'
        aria-label='Close substitutions modal background'
        className='absolute inset-0 bg-black/85'
        onClick={onClose}
      />

      <div className='relative z-10 w-full max-w-xl bg-white border-4 border-black shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] overflow-hidden'>
        <div className='flex items-start justify-between px-4 py-4 sm:px-6 sm:py-5 border-b-4 border-black bg-[#FFD600]'>
          <div>
            <h2 className='text-xl sm:text-2xl font-black uppercase tracking-wide text-black'>
              Substitutions
            </h2>
            <p className='text-xs sm:text-sm font-bold uppercase tracking-wide text-black mt-1'>
              {mealName} - {headerSubtitle}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='border-4 border-black bg-white p-1 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-px hover:translate-y-px'
            aria-label='Close substitutions modal'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='px-4 py-4 sm:px-6 sm:py-5 bg-[#F7F7F7]'>
          <div className='max-h-[22rem] sm:max-h-[24rem] overflow-y-auto space-y-2 pr-1'>
            {restoreRow && (
              <div className='border-4 border-black bg-white px-3 py-3 flex items-center justify-between gap-3'>
                <div>
                  <p className='text-base sm:text-lg font-black uppercase tracking-wide text-black'>
                    {restoreRow.names.join(", ")}
                  </p>
                  <p className='text-xs sm:text-sm font-bold text-black/70'>
                    Original
                  </p>
                </div>
                <button
                  type='button'
                  onClick={onRestoreSubstitution}
                  className='px-4 py-2 border-4 border-black bg-black text-white text-xs sm:text-sm font-black uppercase tracking-wide hover:bg-[#333]'
                >
                  Restore
                </button>
              </div>
            )}
            {candidateRows.map((row) => (
              <div
                key={row.id}
                className='border-4 border-black bg-white px-3 py-3 flex items-center justify-between gap-3'
              >
                <div>
                  <p className='text-base sm:text-lg font-black uppercase tracking-wide text-black'>
                    {row.name}
                  </p>
                  <p className='text-xs sm:text-sm font-bold text-black/70'>
                    {row.grams} g
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => onApplySubstitution(row.id)}
                  className='px-4 py-2 border-4 border-black bg-black text-white text-xs sm:text-sm font-black uppercase tracking-wide hover:bg-[#333]'
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
