import React, { useMemo, useState } from "react";
import { Pencil, X } from "lucide-react";
import {
  PLAN_DESCRIPTION_MAX_LENGTH,
  PLAN_NAME_MAX_LENGTH,
} from "../data/constants";

const EMPTY_DRAFT = { name: "", description: "" };

const inputClass =
  "w-full px-3 py-2.5 border-4 border-black bg-white text-sm md:text-base font-bold text-black placeholder:text-slate-500 focus:outline-none focus:bg-[#FFD600]";
const labelClass =
  "block text-xs font-black uppercase tracking-wide text-black mb-1.5";
const formButtonClass =
  "flex-1 px-4 py-2.5 border-4 border-black text-sm font-black uppercase tracking-wide";
const listButtonClass =
  "px-4 py-2.5 border-4 border-black bg-black text-white text-sm font-black uppercase tracking-wide transition-transform hover:translate-x-px hover:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed";

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
  isPlansLoading,
  isInitialPlanSetupRequired,
  onCreatePlan,
  onUpdatePlan,
  onSelectPlan,
  onDeletePlan,
}) {
  // "current" only shows up on the very first sign-in, when the plan on screen
  // has nowhere to live yet.
  const [mode, setMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [showErrors, setShowErrors] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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

  const activePlan = mealPlans.find((plan) => plan.id === activePlanId) || null;
  const formMode = isInitialPlanSetupRequired ? "current" : mode;
  const isFormOpen = Boolean(formMode);
  const nameError = draft.name.trim() ? null : "Required";

  const closeForm = () => {
    setMode(null);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setShowErrors(false);
    setIsConfirmingDelete(false);
  };

  const handleClose = () => {
    if (!canClose) {
      return;
    }

    closeForm();
    onClose();
  };

  const openCreateForm = (nextMode) => {
    setIsConfirmingDelete(false);
    setEditingId(null);
    setShowErrors(false);
    setDraft(
      nextMode === "duplicate" && activePlan
        ? {
            name: `Copy of ${activePlan.name}`.slice(0, PLAN_NAME_MAX_LENGTH),
            description: activePlan.description || "",
          }
        : EMPTY_DRAFT,
    );
    setMode(nextMode);
  };

  const openEditForm = (plan) => {
    setIsConfirmingDelete(false);
    setEditingId(plan.id);
    setShowErrors(false);
    setDraft({ name: plan.name, description: plan.description || "" });
    setMode("edit");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (nameError) {
      setShowErrors(true);
      return;
    }

    const details = {
      name: draft.name.trim(),
      description: draft.description.trim(),
    };

    if (formMode === "edit") {
      await onUpdatePlan(editingId, details);
      closeForm();
      return;
    }

    closeForm();
    await onCreatePlan({ ...details, mode: formMode });
  };

  const confirmDelete = async () => {
    const planId = editingId;
    closeForm();
    await onDeletePlan(planId);
  };

  const handleCardClick = (planId) => {
    void onSelectPlan(planId);
  };

  const formTitle = {
    current: "Save current plan",
    new: "New plan",
    duplicate: "Duplicate plan",
    edit: "Edit plan",
  }[formMode];

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4'>
      <button
        type='button'
        aria-label='Close meal plans modal background'
        className='absolute inset-0 bg-black/85'
        onClick={handleClose}
      />

      <div className='relative z-10 w-full max-w-2xl bg-white border-4 border-black shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] overflow-hidden'>
        <div className='flex items-start justify-between px-4 py-4 sm:px-6 sm:py-5 border-b-4 border-black bg-[#FFD600]'>
          <h2 className='text-xl sm:text-2xl font-black uppercase tracking-wide text-black'>
            {isFormOpen ? formTitle : "Your meal plans"}
          </h2>
          <button
            type='button'
            onClick={handleClose}
            className='border-4 border-black bg-white p-1 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-px hover:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed'
            aria-label='Close meal plans modal'
            disabled={!canClose}
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* The list steps aside while a plan form is open. */}
        {!isFormOpen && (
          <div className='px-4 py-4 sm:px-6 sm:py-5 bg-[#F7F7F7]'>
            <div className='max-h-90 overflow-y-auto pr-1 space-y-3'>
              {sortedPlans.map((plan) => {
                const isActive = activePlanId === plan.id;

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
                      <div className='min-w-0'>
                        <div className='text-lg md:text-xl font-black uppercase tracking-wide text-black leading-tight'>
                          {plan.name}
                        </div>
                        {plan.description && (
                          <div className='text-xs md:text-sm font-bold text-black/70 mt-1'>
                            {plan.description}
                          </div>
                        )}
                        <div className='text-xs md:text-sm font-bold text-black/50 mt-1'>
                          {formatCreatedAt(plan.createdAt)}
                        </div>
                      </div>

                      <div className='flex items-center gap-2 sm:gap-3 shrink-0'>
                        <span
                          className={`h-10 px-3 inline-flex items-center border-2 border-black text-xs md:text-sm font-black uppercase tracking-wide ${
                            isActive
                              ? "bg-[#FFD600] text-black"
                              : "bg-white text-black"
                          }`}
                        >
                          {`${Math.round(plan.totalKcal || 0)}Kcal`}
                        </span>

                        <span
                          role='button'
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditForm(plan);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.stopPropagation();
                              openEditForm(plan);
                            }
                          }}
                          className='p-1.5 border-2 border-black bg-white text-black'
                          aria-label={`Edit ${plan.name}`}
                        >
                          <Pencil className='w-5 h-5' />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className='flex justify-center gap-2.5 pt-1 pb-1'>
                <button
                  type='button'
                  onClick={() => openCreateForm("new")}
                  disabled={isPlansLoading}
                  className={listButtonClass}
                >
                  New plan
                </button>
                <button
                  type='button'
                  onClick={() => openCreateForm("duplicate")}
                  disabled={isPlansLoading || !activePlan}
                  className={listButtonClass}
                >
                  Duplicate plan
                </button>
              </div>
            </div>
          </div>
        )}

        {isFormOpen && (
          <div className='px-4 py-4 sm:px-6 sm:py-5 bg-white'>
            <form className='space-y-3' onSubmit={handleSubmit}>
              <div>
                <label className={labelClass} htmlFor='meal-plan-name'>
                  Name
                </label>
                <input
                  id='meal-plan-name'
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder='Cutting week'
                  maxLength={PLAN_NAME_MAX_LENGTH}
                  className={inputClass}
                />
                {showErrors && nameError && (
                  <p className='mt-1 text-xs font-black uppercase tracking-wide text-[#FF2A5F]'>
                    {nameError}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor='meal-plan-description'>
                  Description
                </label>
                <input
                  id='meal-plan-description'
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder='High protein, low carb'
                  maxLength={PLAN_DESCRIPTION_MAX_LENGTH}
                  className={inputClass}
                />
              </div>

              {isConfirmingDelete && (
                <p className='text-xs md:text-sm font-bold text-black'>
                  Deleting removes this plan with its meals and food groups.
                </p>
              )}

              {formMode === "current" ? (
                <button
                  type='submit'
                  disabled={isPlansLoading}
                  className={`${formButtonClass} w-full bg-black text-white transition-transform hover:translate-x-px hover:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  Save
                </button>
              ) : (
                <div className='flex gap-2.5'>
                  <button
                    type='button'
                    onClick={
                      isConfirmingDelete
                        ? () => setIsConfirmingDelete(false)
                        : closeForm
                    }
                    className={`${formButtonClass} bg-white text-black hover:bg-[#F2F2F2]`}
                  >
                    Cancel
                  </button>

                  {formMode === "edit" && (
                    <button
                      type='button'
                      onClick={
                        isConfirmingDelete
                          ? () => void confirmDelete()
                          : () => setIsConfirmingDelete(true)
                      }
                      className={`${formButtonClass} text-black hover:bg-[#FF2A5F] hover:text-white ${
                        isConfirmingDelete
                          ? "bg-[#FF2A5F] text-white"
                          : "bg-white"
                      }`}
                    >
                      Delete
                    </button>
                  )}

                  {!isConfirmingDelete && (
                    <button
                      type='submit'
                      disabled={isPlansLoading}
                      className={`${formButtonClass} bg-black text-white transition-transform hover:translate-x-px hover:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {formMode === "edit" ? "Save" : "Create"}
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
