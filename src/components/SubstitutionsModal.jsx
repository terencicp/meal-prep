import React, { useMemo } from "react";
import { X } from "lucide-react";
import { FOOD_GROUPS } from "../data/constants";

export default function SubstitutionsModal({
  isOpen,
  mealName,
  sourceFoodId,
  sourceFoodAmount,
  currentReplacementFoodId,
  onClose,
  onApplySubstitution,
}) {
  const sourceFood = useMemo(() => {
    return FOOD_GROUPS.find((food) => food.id === sourceFoodId) || null;
  }, [sourceFoodId]);

  const targetCalories = useMemo(() => {
    if (
      !sourceFood ||
      !Number.isFinite(sourceFoodAmount) ||
      sourceFoodAmount <= 0
    ) {
      return 0;
    }

    return (sourceFoodAmount / 100) * sourceFood.kCal;
  }, [sourceFood, sourceFoodAmount]);

  const substitutionRows = useMemo(() => {
    if (!sourceFood || targetCalories <= 0) {
      return [];
    }

    const canUndoSubstitution =
      Boolean(currentReplacementFoodId) &&
      currentReplacementFoodId !== sourceFood.id;

    const substitutionCandidates = canUndoSubstitution
      ? [sourceFood, ...FOOD_GROUPS.filter((food) => food.id !== sourceFood.id)]
      : FOOD_GROUPS.filter((food) => food.id !== sourceFood.id);

    return substitutionCandidates.map((food) => {
      const grams =
        food.kCal > 0 ? Math.round((targetCalories * 100) / food.kCal) : 0;

      return {
        id: food.id,
        name: food.name,
        grams,
        isRestoreOption: food.id === sourceFood.id,
      };
    });
  }, [sourceFood, targetCalories, currentReplacementFoodId]);

  if (!isOpen || !sourceFood) {
    return null;
  }

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
              {mealName} - {sourceFood.name} {sourceFoodAmount}g
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
          <div className='max-h-[24rem] overflow-y-auto space-y-2 pr-1'>
            {substitutionRows.map((row) => (
              <div
                key={row.id}
                className='border-4 border-black bg-white px-3 py-3 flex items-center justify-between gap-3'
              >
                <div>
                  <p className='text-base sm:text-lg font-black uppercase tracking-wide text-black'>
                    {row.name}
                  </p>
                  <p className='text-xs sm:text-sm font-bold text-black/70'>
                    {row.grams} g for same calories
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => onApplySubstitution(row.id)}
                  className='px-4 py-2 border-4 border-black bg-black text-white text-xs sm:text-sm font-black uppercase tracking-wide hover:bg-[#333]'
                >
                  {row.isRestoreOption ? "Restore" : "Apply"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
