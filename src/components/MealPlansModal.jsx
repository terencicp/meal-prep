import React, { useMemo, useState } from "react";
import { Trash2, X } from "lucide-react";

function formatCreatedAt(dateValue) {
  if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
    return "Created recently";
  }

  return `Created ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateValue)}`;
}

export default function MealPlansModal({
  isOpen,
  canClose,
  onClose,
  mealPlans,
  activePlanId,
  isInitialPlanSetupRequired,
  planNameInput,
  setPlanNameInput,
  isPlansLoading,
  onSavePlan,
  onSelectPlan,
  onDeletePlan,
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const sortedPlans = useMemo(() => {
    return [...mealPlans].sort((a, b) => {
      const aTime = a.updatedAt?.getTime?.() ?? 0;
      const bTime = b.updatedAt?.getTime?.() ?? 0;
      return bTime - aTime;
    });
  }, [mealPlans]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = () => {
    if (canClose) {
      onClose();
    }
  };

  const handleCardClick = (planId) => {
    if (pendingDeleteId === planId) {
      return;
    }

    void onSelectPlan(planId);
    setPendingDeleteId(null);
  };

  const handleDeleteClick = (event, planId) => {
    event.stopPropagation();
    setPendingDeleteId(planId);
  };

  const handleDeleteConfirm = async (event, planId) => {
    event.stopPropagation();
    await onDeletePlan(planId);
    setPendingDeleteId(null);
  };

  const handleDeleteCancel = (event) => {
    event.stopPropagation();
    setPendingDeleteId(null);
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4'>
      <button
        type='button'
        aria-label='Close meal plans modal background'
        className='absolute inset-0 bg-gray-900/70'
        onClick={handleBackdropClick}
      />

      <div className='relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden'>
        <div className='flex items-start justify-between p-4 sm:p-5 border-b border-slate-200'>
          <h2 className='text-lg sm:text-xl font-bold tracking-tight text-slate-800'>
            Your meal plans
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='text-slate-400 hover:text-slate-600 transition-colors'
            aria-label='Close meal plans modal'
            disabled={!canClose}
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-4 sm:p-5 border-b border-slate-200'>
          <h3 className='text-sm font-bold text-slate-700 mb-2.5'>
            Save current plan
          </h3>
          <form
            className='flex flex-col sm:flex-row gap-2.5'
            onSubmit={(event) => {
              event.preventDefault();
              void onSavePlan();
            }}
          >
            <input
              value={planNameInput}
              onChange={(event) => setPlanNameInput(event.target.value)}
              placeholder='Plan name'
              className='flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-500'
              maxLength={70}
            />
            <button
              type='submit'
              disabled={isPlansLoading}
              className='px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-bold tracking-wide transition-colors'
            >
              SAVE
            </button>
          </form>
        </div>

        <div className='p-4 sm:p-5'>
          <h3 className='text-sm font-bold text-slate-700 mb-3'>
            Load saved plan
          </h3>

          <div className='max-h-90 overflow-y-auto pr-1 space-y-3'>
            {sortedPlans.length === 0 && (
              <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500'>
                {isInitialPlanSetupRequired
                  ? "Save your first meal plan to get started."
                  : "No meal plans found."}
              </div>
            )}

            {sortedPlans.map((plan) => {
              const isPendingDelete = pendingDeleteId === plan.id;
              const isActive = activePlanId === plan.id;

              return (
                <button
                  type='button'
                  key={plan.id}
                  onClick={() => handleCardClick(plan.id)}
                  className={`w-full text-left rounded-xl border p-3.5 sm:p-4 transition-colors ${
                    isPendingDelete
                      ? "bg-red-50 border-red-200"
                      : isActive
                        ? "bg-green-50 border-green-300"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className='flex items-start sm:items-center justify-between gap-3'>
                    <div>
                      <div className='text-lg md:text-base font-bold text-slate-800 leading-tight'>
                        {plan.name} ({Math.round(plan.totalKcal || 0)}Kcal)
                      </div>
                      <div className='text-xs text-slate-500 mt-1'>
                        {formatCreatedAt(plan.createdAt)}
                      </div>
                    </div>

                    {!isPendingDelete ? (
                      <span
                        role='button'
                        tabIndex={0}
                        onClick={(event) => handleDeleteClick(event, plan.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            handleDeleteClick(event, plan.id);
                          }
                        }}
                        className='p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        aria-label={`Delete ${plan.name}`}
                      >
                        <Trash2 className='w-5 h-5' />
                      </span>
                    ) : (
                      <div className='hidden sm:flex items-center gap-3'>
                        <button
                          type='button'
                          onClick={handleDeleteCancel}
                          className='px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold'
                        >
                          Cancel
                        </button>
                        <button
                          type='button'
                          onClick={(event) =>
                            void handleDeleteConfirm(event, plan.id)
                          }
                          className='px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-semibold'
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {isPendingDelete && (
                    <div className='mt-3 flex sm:hidden items-center justify-center gap-3'>
                      <button
                        type='button'
                        onClick={handleDeleteCancel}
                        className='px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold'
                      >
                        Cancel
                      </button>
                      <button
                        type='button'
                        onClick={(event) =>
                          void handleDeleteConfirm(event, plan.id)
                        }
                        className='px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-semibold'
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
