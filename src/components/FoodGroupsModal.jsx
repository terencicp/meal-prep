import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
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
const iconButtonBaseClass =
  "p-1.5 border-2 border-black disabled:opacity-30 disabled:cursor-not-allowed";
const iconButtonClass = `${iconButtonBaseClass} bg-white text-black`;
const formButtonClass =
  "flex-1 px-4 py-2.5 border-4 border-black text-sm font-black uppercase tracking-wide";

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
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  if (!isOpen) {
    return null;
  }

  const visibleCount = allFoodGroups.filter((food) => !food.isHidden).length;
  const customCount = allFoodGroups.filter((food) => food.isCustom).length;
  const isLastGroup = allFoodGroups.length <= 1;
  const validation = validateFoodGroupDraft(draft, {
    allFoodGroups,
    editingId,
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setShowErrors(false);
    setPendingDeleteId(null);
  };

  const handleClose = () => {
    closeForm();
    onClose();
  };

  const openAddForm = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setShowErrors(false);
    setPendingDeleteId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (food) => {
    setPendingDeleteId(null);
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
    onDelete(pendingDeleteId);
    setPendingDeleteId(null);
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
            {isFormOpen
              ? editingId
                ? "Edit food group"
                : "New food group"
              : "Food groups"}
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
                const isConfirmingDelete = pendingDeleteId === food.id;

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

                        <button
                          type='button'
                          onClick={() =>
                            setPendingDeleteId(
                              isConfirmingDelete ? null : food.id,
                            )
                          }
                          disabled={isLastGroup}
                          title={
                            isLastGroup
                              ? "At least one food group is required"
                              : undefined
                          }
                          className={`${iconButtonBaseClass} ${
                            isConfirmingDelete
                              ? "bg-[#FF2A5F] text-white"
                              : "bg-white text-black"
                          }`}
                          aria-label={`Delete ${food.name}`}
                        >
                          <Trash2 className='w-5 h-5' />
                        </button>
                      </div>
                    </div>

                    {isConfirmingDelete && (
                      <div className='mt-3'>
                        {getUsage(food.id).mealCount > 0 && (
                          <p className='text-xs md:text-sm font-bold text-[#FF2A5F]'>
                            This group is currently being used in this plan.
                          </p>
                        )}
                        <div className='flex gap-2.5 mt-2.5'>
                          <button
                            type='button'
                            onClick={() => setPendingDeleteId(null)}
                            className={`${formButtonClass} bg-white text-black hover:bg-[#F2F2F2]`}
                          >
                            Cancel
                          </button>
                          <button
                            type='button'
                            onClick={confirmDelete}
                            className={`${formButtonClass} bg-[#FF2A5F] text-white transition-transform hover:translate-x-px hover:translate-y-px`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
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
                  Shopping multiplier to cover waste (1 = no loss)
                </p>
              </div>

              <div className='flex gap-2.5'>
                <button
                  type='button'
                  onClick={closeForm}
                  className={`${formButtonClass} bg-white text-black hover:bg-[#F2F2F2]`}
                >
                  Cancel
                </button>

                <button
                  type='submit'
                  className={`${formButtonClass} bg-black text-white transition-transform hover:translate-x-px hover:translate-y-px`}
                >
                  {editingId ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
