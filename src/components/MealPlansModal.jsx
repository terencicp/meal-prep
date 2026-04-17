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
        className='absolute inset-0 bg-black/85'
        onClick={handleBackdropClick}
      />

      <div className='relative z-10 w-full max-w-2xl bg-white border-4 border-black shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] overflow-hidden'>
        <div className='flex items-start justify-between px-4 py-4 sm:px-6 sm:py-5 border-b-4 border-black bg-[#FFD600]'>
          <h2 className='text-xl sm:text-2xl font-black uppercase tracking-wide text-black'>
            Your meal plans
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='border-4 border-black bg-white p-1 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-px hover:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed'
            aria-label='Close meal plans modal'
            disabled={!canClose}
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='px-4 py-4 sm:px-6 sm:py-5 border-b-4 border-black bg-white'>
          <h3 className='text-sm md:text-base font-black uppercase tracking-wide text-black mb-2.5'>
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
              className='flex-1 px-3 py-2.5 border-4 border-black bg-white text-sm md:text-base font-bold text-black placeholder:text-slate-500 focus:outline-none focus:bg-[#FFD600]'
              maxLength={70}
            />
            <button
              type='submit'
              disabled={isPlansLoading}
              className='px-6 py-2.5 border-4 border-black bg-black text-white text-sm md:text-base font-black uppercase tracking-wide transition-transform hover:translate-x-px hover:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed'
            >
              SAVE
            </button>
          </form>
        </div>

        {sortedPlans.length > 0 && (
          <div className='px-4 py-4 sm:px-6 sm:py-5 bg-[#F7F7F7]'>
            <h3 className='text-sm md:text-base font-black uppercase tracking-wide text-black mb-3'>
              Load saved plan
            </h3>

            <div className='max-h-90 overflow-y-auto pr-1 space-y-3'>
              {sortedPlans.map((plan) => {
                const isPendingDelete = pendingDeleteId === plan.id;
                const isActive = activePlanId === plan.id;
                const kcalLabel = `${Math.round(plan.totalKcal || 0)}Kcal`;
                const kcalPillClass = isActive
                  ? "bg-[#FFD600] text-black"
                  : "bg-white text-black";

                return (
                  <button
                    type='button'
                    key={plan.id}
                    onClick={() => handleCardClick(plan.id)}
                    className={`w-full text-left border-4 p-3.5 sm:p-4 transition-colors ${
                      isActive
                        ? "bg-[#FFD600] border-black"
                        : "bg-white border-black hover:bg-[#F2F2F2]"
                    }`}
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <div>
                        <div className='text-lg md:text-xl font-black uppercase tracking-wide text-black leading-tight'>
                          {plan.name}
                        </div>
                        <div className='text-xs md:text-sm font-bold text-black/70 mt-1'>
                          {formatCreatedAt(plan.createdAt)}
                        </div>
                      </div>

                      <div className='flex items-center gap-2 sm:gap-3 shrink-0'>
                        <span
                          className={`h-10 px-3 inline-flex items-center border-2 border-black text-xs md:text-sm font-black uppercase tracking-wide ${kcalPillClass}`}
                        >
                          {kcalLabel}
                        </span>

                        {!isPendingDelete ? (
                          <span
                            role='button'
                            tabIndex={0}
                            onClick={(event) =>
                              handleDeleteClick(event, plan.id)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                handleDeleteClick(event, plan.id);
                              }
                            }}
                            className='p-1.5 border-2 border-black bg-white text-black hover:bg-[#FF2A5F] hover:text-white'
                            aria-label={`Delete ${plan.name}`}
                          >
                            <Trash2 className='w-5 h-5' />
                          </span>
                        ) : (
                          <div className='hidden sm:flex items-center gap-3'>
                            <button
                              type='button'
                              onClick={handleDeleteCancel}
                              className='px-4 py-2.5 border-4 border-black bg-white text-black hover:bg-[#F2F2F2] text-xs font-black uppercase tracking-wide'
                            >
                              Cancel
                            </button>
                            <button
                              type='button'
                              onClick={(event) =>
                                void handleDeleteConfirm(event, plan.id)
                              }
                              className='px-4 py-2.5 border-4 border-black bg-[#FF2A5F] text-white hover:bg-[#E6003D] text-xs font-black uppercase tracking-wide'
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isPendingDelete && (
                      <div className='mt-3 flex sm:hidden items-center justify-center gap-3'>
                        <button
                          type='button'
                          onClick={handleDeleteCancel}
                          className='px-4 py-2.5 border-4 border-black bg-white text-black hover:bg-[#F2F2F2] text-xs font-black uppercase tracking-wide'
                        >
                          Cancel
                        </button>
                        <button
                          type='button'
                          onClick={(event) =>
                            void handleDeleteConfirm(event, plan.id)
                          }
                          className='px-4 py-2.5 border-4 border-black bg-[#FF2A5F] text-white hover:bg-[#E6003D] text-xs font-black uppercase tracking-wide'
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
        )}
      </div>
    </div>
  );
}
