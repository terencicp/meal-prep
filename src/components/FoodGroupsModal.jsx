import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import {
  FOOD_GROUP_DESCRIPTION_MAX_LENGTH,
  FOOD_GROUP_NAME_MAX_LENGTH,
  MAX_CUSTOM_FOOD_GROUPS,
  validateFoodGroupDraft,
} from "../data/foodGroups";

const EMPTY_DRAFT = {
  name: "",
  description: "",
  kCal: "",
  carbs: "",
  fats: "",
  protein: "",
  waste: "1",
};

const inputClass =
  "w-full px-3 py-2.5 border-4 border-black bg-white text-sm md:text-base font-bold text-black placeholder:text-slate-500 focus:outline-none focus:bg-[#FFD600]";
const labelClass =
  "block text-xs font-black uppercase tracking-wide text-black mb-1.5";
const iconButtonClass =
  "p-1.5 border-2 border-black bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed";
const formButtonClass =
  "flex-1 px-4 py-2.5 border-4 border-black text-sm font-black uppercase tracking-wide";

function buildDeleteMessage(usage) {
  if (usage.mealCount === 0) {
    return "Delete this food group?";
  }

  const plans =
    usage.planCount > 1 ? ` across ${usage.planCount} saved plans` : "";
  return `Used in ${usage.mealCount} meal${usage.mealCount === 1 ? "" : "s"}${plans}. Deleting sets those grams to 0.`;
}

export default function FoodGroupsModal({
  isOpen,
  onClose,
  allFoodGroups,
  onAdd,
  onUpdate,
  onDelete,
  onSetHidden,
  onMove,
  getUsage,
}) {
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [showErrors, setShowErrors] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isOpen) {
    return null;
  }

  const visibleCount = allFoodGroups.filter((food) => !food.isHidden).length;
  const customCount = allFoodGroups.filter((food) => food.isCustom).length;
  const isEditingLastVisible = Boolean(editingId) && visibleCount <= 1;
  const validation = validateFoodGroupDraft(draft, {
    allFoodGroups,
    editingId,
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setShowErrors(false);
    setIsConfirmingDelete(false);
  };

  const handleClose = () => {
    closeForm();
    onClose();
  };

  const openAddForm = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setShowErrors(false);
    setIsConfirmingDelete(false);
    setIsFormOpen(true);
  };

  const openEditForm = (food) => {
    setIsConfirmingDelete(false);
    setEditingId(food.id);
    setDraft({
      name: food.name,
      description: food.description || "",
      kCal: String(food.kCal),
      carbs: String(food.carbs),
      fats: String(food.fats),
      protein: String(food.protein),
      waste: String(food.waste),
    });
    setShowErrors(false);
    setIsFormOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validation.isValid) {
      setShowErrors(true);
      return;
    }

    if (editingId) {
      onUpdate(editingId, validation.values);
    } else {
      onAdd(validation.values);
    }

    closeForm();
  };

  const confirmDelete = () => {
    onDelete(editingId);
    closeForm();
  };

  const renderField = (field, label, extraProps = {}) => (
    <div>
      <label className={labelClass} htmlFor={`food-group-${field}`}>
        {label}
      </label>
      <input
        id={`food-group-${field}`}
        value={draft[field]}
        onChange={(event) =>
          setDraft((prev) => ({ ...prev, [field]: event.target.value }))
        }
        className={inputClass}
        {...extraProps}
      />
      {showErrors && validation.errors[field] ? (
        <p className='mt-1 text-xs font-black uppercase tracking-wide text-[#FF2A5F]'>
          {validation.errors[field]}
        </p>
      ) : (
        validation.notices[field] && (
          <p className='mt-1 text-xs font-black uppercase tracking-wide text-[#B29500]'>
            {validation.notices[field]}
          </p>
        )
      )}
    </div>
  );

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4'>
      <button
        type='button'
        aria-label='Close food groups modal background'
        className='absolute inset-0 bg-black/85'
        onClick={handleClose}
      />

      <div className='relative z-10 w-full max-w-2xl bg-white border-4 border-black shadow-[9px_9px_0px_0px_rgba(0,0,0,1)] overflow-hidden'>
        <div className='flex items-start justify-between px-4 py-4 sm:px-6 sm:py-5 border-b-4 border-black bg-[#FFD600]'>
          <h2 className='text-xl sm:text-2xl font-black uppercase tracking-wide text-black'>
            Food groups
          </h2>
          <button
            type='button'
            onClick={handleClose}
            className='border-4 border-black bg-white p-1 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-px hover:translate-y-px'
            aria-label='Close food groups modal'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* The list steps aside while the add/edit form is open. */}
        {!isFormOpen && (
          <div className='px-4 py-4 sm:px-6 sm:py-5 bg-[#F7F7F7]'>
            <div className='max-h-90 overflow-y-auto pr-1 space-y-3'>
              {allFoodGroups.map((food, index) => {
                const isLastVisible = !food.isHidden && visibleCount <= 1;

                return (
                  <div
                    key={food.id}
                    className={`border-4 border-black bg-white p-3 ${food.isHidden ? "opacity-60" : ""}`}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <span className='block text-base md:text-lg font-black uppercase tracking-wide text-black truncate'>
                          {food.name}
                        </span>
                        <div className='text-xs md:text-sm font-bold text-black/70 mt-1'>
                          {Math.round(food.kCal)} kcal
                        </div>
                        {food.description && (
                          <div className='text-xs md:text-sm font-bold text-black/50 mt-1'>
                            {food.description}
                          </div>
                        )}
                      </div>

                      <div className='flex items-center gap-1.5 shrink-0'>
                        <button
                          type='button'
                          onClick={() => onMove(food.id, "up")}
                          disabled={index === 0}
                          className={iconButtonClass}
                          aria-label={`Move ${food.name} up`}
                        >
                          <ChevronUp className='w-5 h-5' />
                        </button>
                        <button
                          type='button'
                          onClick={() => onMove(food.id, "down")}
                          disabled={index === allFoodGroups.length - 1}
                          className={iconButtonClass}
                          aria-label={`Move ${food.name} down`}
                        >
                          <ChevronDown className='w-5 h-5' />
                        </button>

                        {food.isCustom && (
                          <button
                            type='button'
                            onClick={() => openEditForm(food)}
                            className={iconButtonClass}
                            aria-label={`Edit ${food.name}`}
                          >
                            <Pencil className='w-5 h-5' />
                          </button>
                        )}

                        <button
                          type='button'
                          onClick={() => onSetHidden(food.id, !food.isHidden)}
                          disabled={isLastVisible}
                          title={
                            isLastVisible
                              ? "At least one food group is required"
                              : undefined
                          }
                          className={iconButtonClass}
                          aria-label={`${food.isHidden ? "Show" : "Hide"} ${food.name}`}
                        >
                          {food.isHidden ? (
                            <EyeOff className='w-5 h-5' />
                          ) : (
                            <Eye className='w-5 h-5' />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className='flex justify-center pt-1 pb-1'>
                <button
                  type='button'
                  onClick={openAddForm}
                  disabled={customCount >= MAX_CUSTOM_FOOD_GROUPS}
                  className='inline-flex items-center gap-2 px-5 py-2.5 border-4 border-black bg-black text-white text-sm font-black uppercase tracking-wide transition-transform hover:translate-x-px hover:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  <Plus className='w-5 h-5' />
                  Add group
                </button>
              </div>
            </div>
          </div>
        )}

        {isFormOpen && (
          <div className='px-4 py-4 sm:px-6 sm:py-5 bg-white'>
            <form className='space-y-3' onSubmit={handleSubmit}>
              <h3 className='text-sm md:text-base font-black uppercase tracking-wide text-black'>
                {editingId ? "Edit food group" : "New food group"}
              </h3>

              {renderField("name", "Name", {
                placeholder: "Tofu",
                maxLength: FOOD_GROUP_NAME_MAX_LENGTH,
              })}
              {renderField("description", "Description", {
                placeholder: "Firm, drained",
                maxLength: FOOD_GROUP_DESCRIPTION_MAX_LENGTH,
              })}

              <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                {renderField("kCal", "kCal / 100g", {
                  type: "number",
                  step: "1",
                  min: "0",
                  placeholder: "144",
                })}
                {renderField("carbs", "Carbs / 100g", {
                  type: "number",
                  step: "0.1",
                  min: "0",
                  placeholder: "0",
                })}
                {renderField("fats", "Fats / 100g", {
                  type: "number",
                  step: "0.1",
                  min: "0",
                  placeholder: "0",
                })}
                {renderField("protein", "Protein / 100g", {
                  type: "number",
                  step: "0.1",
                  min: "0",
                  placeholder: "0",
                })}
              </div>

              <div>
                {renderField("waste", "Prep loss multiplier", {
                  type: "number",
                  step: "0.1",
                  min: "0.1",
                  placeholder: "1",
                })}
                <p className='mt-1 text-xs font-bold text-black/60'>
                  Shopping buys this much extra to cover peel and trim. 1 = no
                  loss.
                </p>
              </div>

              {isConfirmingDelete && (
                <p className='text-xs md:text-sm font-bold text-black'>
                  {buildDeleteMessage(getUsage(editingId))}
                </p>
              )}

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

                {editingId && (
                  <button
                    type='button'
                    onClick={
                      isConfirmingDelete
                        ? confirmDelete
                        : () => setIsConfirmingDelete(true)
                    }
                    disabled={isEditingLastVisible}
                    title={
                      isEditingLastVisible
                        ? "At least one food group is required"
                        : undefined
                    }
                    className={`${formButtonClass} text-black hover:bg-[#FF2A5F] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black ${
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
                    className={`${formButtonClass} bg-black text-white transition-transform hover:translate-x-px hover:translate-y-px`}
                  >
                    {editingId ? "Save" : "Add"}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
