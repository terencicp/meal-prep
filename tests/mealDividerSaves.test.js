import assert from "node:assert/strict";
import test from "node:test";
import {
  flushDividerSaves,
  queueDividerSave,
  readDividerSave,
  restoreMealDividers,
} from "../src/data/mealDividerSaves.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("failed account saves survive reopening and can be retried", async () => {
  const storage = memoryStorage();
  queueDividerSave("user", "plan", ["fruit", "nuts"], storage);
  await assert.rejects(flushDividerSaves("user", "plan", async () => {
    throw new Error("offline");
  }, storage), /offline/);
  assert.deepEqual(readDividerSave("user", "plan", storage).ids, ["fruit", "nuts"]);

  const writes = [];
  await flushDividerSaves("user", "plan", async (ids) => writes.push(ids), storage);
  assert.deepEqual(writes, [["fruit", "nuts"]]);
  assert.equal(readDividerSave("user", "plan", storage), null);
});

test("an older save response cannot acknowledge a newer edit", async () => {
  const storage = memoryStorage();
  queueDividerSave("user", "plan", ["fruit"], storage);
  const writes = [];
  await flushDividerSaves("user", "plan", async (ids) => {
    writes.push(ids);
    if (writes.length === 1) {
      queueDividerSave("user", "plan", ["fruit", "nuts"], storage);
    }
  }, storage);
  assert.deepEqual(writes, [["fruit"], ["fruit", "nuts"]]);
  assert.equal(readDividerSave("user", "plan", storage), null);
});

test("removing every divider remains a pending save", async () => {
  const storage = memoryStorage();
  queueDividerSave("user", "plan", [], storage);
  assert.deepEqual(readDividerSave("user", "plan", storage).ids, []);
  const writes = [];
  await flushDividerSaves("user", "plan", async (ids) => writes.push(ids), storage);
  assert.deepEqual(writes, [[]]);
});

test("pending edits stay isolated by account and meal plan", async () => {
  const storage = memoryStorage();
  queueDividerSave("first-user", "first-plan", ["fruit"], storage);
  queueDividerSave("first-user", "second-plan", ["nuts"], storage);
  queueDividerSave("second-user", "first-plan", ["eggs"], storage);
  await flushDividerSaves("first-user", "first-plan", async () => {}, storage);
  assert.equal(readDividerSave("first-user", "first-plan", storage), null);
  assert.deepEqual(readDividerSave("first-user", "second-plan", storage).ids, ["nuts"]);
  assert.deepEqual(readDividerSave("second-user", "first-plan", storage).ids, ["eggs"]);
});

test("restoring a plan keeps pending edits over an older account copy", () => {
  const storage = memoryStorage();
  queueDividerSave("user", "plan", ["fruit", "nuts"], storage);
  assert.deepEqual(restoreMealDividers("user", "plan", ["fruit"], storage), ["fruit", "nuts"]);
  assert.deepEqual(restoreMealDividers("other-user", "plan", ["eggs"], storage), ["eggs"]);
});

test("restoring a pending removal does not resurrect saved dividers", () => {
  const storage = memoryStorage();
  queueDividerSave("user", "plan", [], storage);
  assert.deepEqual(restoreMealDividers("user", "plan", ["fruit"], storage), []);
});
