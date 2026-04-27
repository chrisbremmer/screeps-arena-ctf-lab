import { test } from "node:test";
import assert from "node:assert/strict";
import { towerChargePlan } from "../src/intel/economy.mjs";
import { PART } from "../src/intel/body.mjs";

const tower = (id, freeCap = 100) => ({
  id,
  store: { getFreeCapacity: () => freeCap },
});
const container = (id, energy = 0) => ({ id, store: { energy } });
const creep = (id, parts = {}) => ({
  id,
  _parts: { [PART.CARRY]: 0, [PART.MOVE]: 0, ...parts },
});
const baseSnap = (overrides = {}) => ({
  myCreeps: [],
  myTowers: [],
  containers: [],
  findClosestByPath: (_, items) => items[0] ?? null,
  ...overrides,
});

test("towerChargePlan: empty when no carry-bearing creeps", () => {
  const snap = baseSnap({
    myCreeps: [creep("c1")],
    myTowers: [tower("t1")],
    containers: [container("k1", 500)],
  });
  assert.deepEqual(towerChargePlan(snap), []);
});

test("towerChargePlan: empty when no my towers", () => {
  const snap = baseSnap({
    myCreeps: [creep("c1", { [PART.CARRY]: 1 })],
    containers: [container("k1", 500)],
  });
  assert.deepEqual(towerChargePlan(snap), []);
});

test("towerChargePlan: empty when containers have no energy", () => {
  const snap = baseSnap({
    myCreeps: [creep("c1", { [PART.CARRY]: 1 })],
    myTowers: [tower("t1")],
    containers: [container("k1", 0)],
  });
  assert.deepEqual(towerChargePlan(snap), []);
});

test("towerChargePlan: skips a full tower", () => {
  const snap = baseSnap({
    myCreeps: [creep("c1", { [PART.CARRY]: 1 })],
    myTowers: [tower("t1", 0)],  // 0 free capacity
    containers: [container("k1", 500)],
  });
  assert.deepEqual(towerChargePlan(snap), []);
});

test("towerChargePlan: produces a plan when conditions met", () => {
  const t = tower("t1", 100);
  const k = container("k1", 500);
  const snap = baseSnap({
    myCreeps: [creep("c1", { [PART.CARRY]: 1 })],
    myTowers: [t],
    containers: [k],
  });
  const plan = towerChargePlan(snap);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].tower.id, "t1");
  assert.equal(plan[0].container.id, "k1");
});
