import { normalizeMealDividers } from "./mealDividers.js";

export function dividerSaveKey(userId, planId) {
  return `mealPlannerDividerSave:${JSON.stringify([userId, planId])}`;
}

export function readDividerSave(userId, planId, storage = localStorage) {
  try {
    const value = JSON.parse(storage.getItem(dividerSaveKey(userId, planId)));
    return typeof value?.revision === "string" && Array.isArray(value?.ids)
      ? { revision: value.revision, ids: normalizeMealDividers(value.ids) }
      : null;
  } catch (error) {
    console.error("Failed to read pending divider save:", error);
    return null;
  }
}

export function queueDividerSave(userId, planId, ids, storage = localStorage) {
  const pending = {
    revision: crypto.randomUUID(),
    ids: normalizeMealDividers(ids),
  };
  storage.setItem(dividerSaveKey(userId, planId), JSON.stringify(pending));
  return pending;
}

export function restoreMealDividers(userId, planId, saved, storage = localStorage) {
  return readDividerSave(userId, planId, storage)?.ids ?? normalizeMealDividers(saved);
}

// Only acknowledge the version actually written. If another split was changed
// during the request, save that newer version next rather than discarding it.
export async function flushDividerSaves(userId, planId, write, storage = localStorage) {
  let pending = readDividerSave(userId, planId, storage);
  while (pending) {
    await write(pending.ids);
    const latest = readDividerSave(userId, planId, storage);
    if (latest?.revision === pending.revision) {
      storage.removeItem(dividerSaveKey(userId, planId));
    }
    pending = readDividerSave(userId, planId, storage);
  }
}
