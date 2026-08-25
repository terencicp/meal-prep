// Resolves the user's food group catalog: the predefined groups plus any custom
// ones, minus the hidden ones, in the user's chosen order.
import { FOOD_GROUPS } from "./constants";

export const PREDEFINED_FOOD_GROUPS = FOOD_GROUPS;

const PREDEFINED_IDS = FOOD_GROUPS.map((food) => food.id);

// Shopping amounts for these are counted in units instead of weight.
export const UNIT_WEIGHTS_BY_ID = { eggs: 50, yogurt: 120 };

// How much of a food to put in the pot for every gram that ends up on the
// plate. A purchase multiplier below 1 means the food is bought dry and swells
// as it cooks, so the pot needs proportionally less. Above 1 it is peel and
// trim loss, which is paid for at the shop and never changes what is cooked.
export function getCookRatio(food) {
  const waste = typeof food?.waste === "number" ? food.waste : 1;
  return Math.min(waste, 1);
}

export const EMPTY_FOOD_GROUP_CATALOG = {
  custom: [],
  hidden: [],
  order: [],
  removed: [],
};

export const CUSTOM_FOOD_GROUP_ID_PREFIX = "custom_";
export const MAX_CUSTOM_FOOD_GROUPS = 30;
export const FOOD_GROUP_NAME_MAX_LENGTH = 40;
export const FOOD_GROUP_DESCRIPTION_MAX_LENGTH = 120;
export const FOOD_GROUP_KCAL_MAX = 1000;
export const FOOD_GROUP_MACRO_MAX = 100;
export const FOOD_GROUP_WASTE_MIN = 0.1;
export const FOOD_GROUP_WASTE_MAX = 5;

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
}

function clampNumber(value, min, max, fallback) {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    return fallback;
  }

  return roundToTwoDecimals(Math.min(max, Math.max(min, parsed)));
}

function uniqueStrings(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const result = [];
  value.forEach((entry) => {
    if (typeof entry !== "string" || seen.has(entry)) {
      return;
    }
    seen.add(entry);
    result.push(entry);
  });

  return result;
}

export function createCustomFoodGroupId(name, takenIds) {
  const slug = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 20)
    .replace(/^-+|-+$/g, "");
  const base = `${CUSTOM_FOOD_GROUP_ID_PREFIX}${slug || "group"}`;

  let candidate = `${base}_${Math.random().toString(36).slice(2, 7)}`;
  while (takenIds.has(candidate)) {
    candidate = `${base}_${Math.random().toString(36).slice(2, 7)}`;
  }

  return candidate;
}

function normalizeCustomFoodGroup(raw, takenIds) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const name =
    typeof raw.name === "string"
      ? raw.name.trim().slice(0, FOOD_GROUP_NAME_MAX_LENGTH)
      : "";
  if (!name) {
    return null;
  }

  const hasUsableId =
    typeof raw.id === "string" &&
    raw.id.startsWith(CUSTOM_FOOD_GROUP_ID_PREFIX) &&
    !takenIds.has(raw.id);

  return {
    id: hasUsableId ? raw.id : createCustomFoodGroupId(name, takenIds),
    name,
    description:
      typeof raw.description === "string"
        ? raw.description.trim().slice(0, FOOD_GROUP_DESCRIPTION_MAX_LENGTH)
        : "",
    kCal: clampNumber(raw.kCal, 0, FOOD_GROUP_KCAL_MAX, 0),
    carbs: clampNumber(raw.carbs, 0, FOOD_GROUP_MACRO_MAX, 0),
    fats: clampNumber(raw.fats, 0, FOOD_GROUP_MACRO_MAX, 0),
    protein: clampNumber(raw.protein, 0, FOOD_GROUP_MACRO_MAX, 0),
    waste: clampNumber(
      raw.waste,
      FOOD_GROUP_WASTE_MIN,
      FOOD_GROUP_WASTE_MAX,
      1,
    ),
  };
}

export function normalizeFoodGroupCatalog(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const takenIds = new Set(PREDEFINED_IDS);
  const custom = [];

  // Deleted predefined groups stay deleted for this catalog only. Their ids
  // remain taken so a later custom group can never reuse them.
  const removed = uniqueStrings(source.removed).filter((id) =>
    takenIds.has(id),
  );
  const removedIds = new Set(removed);

  (Array.isArray(source.custom) ? source.custom : []).forEach((entry) => {
    if (custom.length >= MAX_CUSTOM_FOOD_GROUPS) {
      return;
    }

    const normalized = normalizeCustomFoodGroup(entry, takenIds);
    if (!normalized) {
      return;
    }

    takenIds.add(normalized.id);
    custom.push(normalized);
  });

  const knownIds = new Set([...takenIds].filter((id) => !removedIds.has(id)));

  return {
    custom,
    hidden: uniqueStrings(source.hidden).filter((id) => knownIds.has(id)),
    order: uniqueStrings(source.order).filter((id) => knownIds.has(id)),
    removed,
  };
}

export function resolveAllFoodGroups(catalogInput) {
  const catalog = normalizeFoodGroupCatalog(catalogInput);
  const hiddenIds = new Set(catalog.hidden);

  const decorate = (food, isCustom) => ({
    ...food,
    description: typeof food.description === "string" ? food.description : "",
    waste: typeof food.waste === "number" ? food.waste : 1,
    isCustom,
    isHidden: hiddenIds.has(food.id),
  });

  const removedIds = new Set(catalog.removed);

  const all = [
    ...PREDEFINED_FOOD_GROUPS.filter((food) => !removedIds.has(food.id)).map(
      (food) => decorate(food, false),
    ),
    ...catalog.custom.map((food) => decorate(food, true)),
  ];

  const byId = new Map(all.map((food) => [food.id, food]));
  const ordered = [];
  const placedIds = new Set();

  catalog.order.forEach((id) => {
    const food = byId.get(id);
    if (!food || placedIds.has(id)) {
      return;
    }
    placedIds.add(id);
    ordered.push(food);
  });

  // Anything the stored order doesn't mention (e.g. a newly shipped predefined
  // group) keeps its declaration order at the end of the list.
  all.forEach((food) => {
    if (!placedIds.has(food.id)) {
      ordered.push(food);
    }
  });

  return ordered;
}

export function resolveVisibleFoodGroups(catalogInput) {
  const all = resolveAllFoodGroups(catalogInput);
  const visible = all.filter((food) => !food.isHidden);
  return visible.length > 0 ? visible : all;
}

export function buildFoodGroupMap(foodGroups) {
  return foodGroups.reduce((acc, food) => {
    acc[food.id] = food;
    return acc;
  }, {});
}

// --- Substitution ranking ---
// A substitution is always scaled to match the calories it replaces, so what
// still separates one candidate from another is how those calories are built:
// the split between carbs, fats and protein. Candidates are ranked on that
// split, and ones whose split is equally close are then ordered by how close
// their portion size lands to the original.
const MACRO_KCAL_PER_GRAM = { carbs: 4, fats: 9, protein: 4 };

// Splits closer than this count as equally similar, so the portion size gets
// to decide between them instead of a rounding-level difference.
const MACRO_SPLIT_PRECISION = 1000;

// Sentinels for foods we cannot score, kept finite so comparing two of them
// stays a number.
const NO_MACRO_DATA = 2;
const NO_PORTION_DATA = Number.MAX_SAFE_INTEGER;

function getMacroEnergySplit({ carbs, fats, protein }) {
  const fromCarbs = (Number(carbs) || 0) * MACRO_KCAL_PER_GRAM.carbs;
  const fromFats = (Number(fats) || 0) * MACRO_KCAL_PER_GRAM.fats;
  const fromProtein = (Number(protein) || 0) * MACRO_KCAL_PER_GRAM.protein;
  const total = fromCarbs + fromFats + fromProtein;

  if (!(total > 0)) {
    return null;
  }

  return {
    carbs: fromCarbs / total,
    fats: fromFats / total,
    protein: fromProtein / total,
  };
}

// 0 when two foods draw their calories from the macros in the same
// proportions, 1 when they have no overlap at all.
function getMacroSplitDistance(a, b) {
  return (
    (Math.abs(a.carbs - b.carbs) +
      Math.abs(a.fats - b.fats) +
      Math.abs(a.protein - b.protein)) /
    2
  );
}

function sumSourceNutrition(sources) {
  return (sources || []).reduce(
    (totals, source) => {
      const food = source?.food;
      const grams = source?.grams;
      if (!food || !Number.isFinite(grams) || grams <= 0) {
        return totals;
      }

      const portions = grams / 100;
      return {
        carbs: totals.carbs + (Number(food.carbs) || 0) * portions,
        fats: totals.fats + (Number(food.fats) || 0) * portions,
        protein: totals.protein + (Number(food.protein) || 0) * portions,
        kCal: totals.kCal + (Number(food.kCal) || 0) * portions,
        grams: totals.grams + grams,
      };
    },
    { carbs: 0, fats: 0, protein: 0, kCal: 0, grams: 0 },
  );
}

// Sorts candidates so the most nutritionally similar replacements come first.
// Sources are the foods being replaced, as [{ food, grams }].
export function rankSubstitutionCandidates(candidates, sources) {
  const totals = sumSourceNutrition(sources);
  const sourceSplit = getMacroEnergySplit(totals);

  // Nothing to compare against, so the catalog order stands.
  if (!sourceSplit) {
    return [...candidates];
  }

  const sourceDensity =
    totals.grams > 0 ? (totals.kCal * 100) / totals.grams : 0;

  return candidates
    .map((food, index) => {
      const split = getMacroEnergySplit(food);
      const distance = split
        ? getMacroSplitDistance(split, sourceSplit)
        : NO_MACRO_DATA;

      return {
        food,
        index,
        splitScore:
          distance === NO_MACRO_DATA
            ? NO_MACRO_DATA
            : Math.round(distance * MACRO_SPLIT_PRECISION) /
              MACRO_SPLIT_PRECISION,
        portionScore:
          food.kCal > 0 && sourceDensity > 0
            ? Math.abs(Math.log(food.kCal / sourceDensity))
            : NO_PORTION_DATA,
      };
    })
    .sort(
      (a, b) =>
        a.splitScore - b.splitScore ||
        a.portionScore - b.portionScore ||
        a.index - b.index,
    )
    .map((entry) => entry.food);
}

export function moveIdInOrder(order, id, direction) {
  const currentIndex = order.indexOf(id);
  const nextIndex = currentIndex + (direction === "up" ? -1 : 1);
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= order.length) {
    return order;
  }

  const next = [...order];
  next[currentIndex] = next[nextIndex];
  next[nextIndex] = id;
  return next;
}

export function countFoodGroupUsage(meals, foodGroupId) {
  if (!meals || typeof meals !== "object") {
    return 0;
  }

  return Object.values(meals).reduce(
    (count, mealFoods) => count + ((mealFoods?.[foodGroupId] || 0) > 0 ? 1 : 0),
    0,
  );
}

export function removeFoodGroupFromMeals(meals, foodGroupId) {
  const next = {};
  Object.entries(meals || {}).forEach(([mealName, mealFoods]) => {
    const { [foodGroupId]: _removed, ...rest } = mealFoods || {};
    next[mealName] = rest;
  });

  return next;
}

export function validateFoodGroupDraft(draft, { allFoodGroups, editingId }) {
  const errors = {};
  const name = String(draft.name || "").trim();

  if (!name) {
    errors.name = "Name is required";
  } else if (name.length > FOOD_GROUP_NAME_MAX_LENGTH) {
    errors.name = `Max ${FOOD_GROUP_NAME_MAX_LENGTH} characters`;
  } else {
    const isTaken = allFoodGroups.some(
      (food) =>
        food.id !== editingId &&
        food.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (isTaken) {
      errors.name = "Name already used";
    }
  }

  const description = String(draft.description || "").trim();
  if (description.length > FOOD_GROUP_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Max ${FOOD_GROUP_DESCRIPTION_MAX_LENGTH} characters`;
  }

  const readNumber = (rawValue, field, { min, max, blankValue }) => {
    const raw = String(rawValue ?? "").trim();
    if (!raw) {
      if (blankValue === null) {
        errors[field] = "Required";
        return 0;
      }
      return blankValue;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      errors[field] = "Must be a number";
      return 0;
    }

    if (parsed < min || parsed > max) {
      errors[field] = `Must be ${min}-${max}`;
      return 0;
    }

    return roundToTwoDecimals(parsed);
  };

  const kCal = readNumber(draft.kCal, "kCal", {
    min: 0,
    max: FOOD_GROUP_KCAL_MAX,
    blankValue: null,
  });
  const carbs = readNumber(draft.carbs, "carbs", {
    min: 0,
    max: FOOD_GROUP_MACRO_MAX,
    blankValue: null,
  });
  const fats = readNumber(draft.fats, "fats", {
    min: 0,
    max: FOOD_GROUP_MACRO_MAX,
    blankValue: null,
  });
  const protein = readNumber(draft.protein, "protein", {
    min: 0,
    max: FOOD_GROUP_MACRO_MAX,
    blankValue: null,
  });
  const waste = readNumber(draft.waste, "waste", {
    min: FOOD_GROUP_WASTE_MIN,
    max: FOOD_GROUP_WASTE_MAX,
    blankValue: 1,
  });

  // Non-blocking hint, and only once every number it depends on is valid.
  const notices = {};
  const hasUsableNumbers = ["kCal", "carbs", "fats", "protein"].every(
    (field) => !errors[field],
  );
  const macroKcal = carbs * 4 + fats * 9 + protein * 4;

  if (hasUsableNumbers && kCal > 0 && Math.abs(macroKcal - kCal) > kCal * 0.1) {
    notices.kCal = `Macros add up to ${Math.round(macroKcal)} kcal`;
  }

  return {
    errors,
    notices,
    isValid: Object.keys(errors).length === 0,
    values: { name, description, kCal, carbs, fats, protein, waste },
  };
}
