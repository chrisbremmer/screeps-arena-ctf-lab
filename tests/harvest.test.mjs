import { test } from "node:test";
import assert from "node:assert/strict";
import { pickHarvestTarget, shouldHarvest } from "../src/intel/harvest.mjs";
import { PART } from "../src/intel/body.mjs";

const part = (id, type, x, y) => ({ id, type, x, y });
const at = (x, y) => ({ x, y });

test("pickHarvestTarget: empty parts → null", () => {
  assert.equal(pickHarvestTarget(at(0, 0), []), null);
  assert.equal(pickHarvestTarget(at(0, 0), null), null);
});

test("pickHarvestTarget: prioritizes MOVE over RANGED_ATTACK at similar distance", () => {
  const parts = [
    part("ra", PART.RANGED_ATTACK, 5, 5),
    part("mv", PART.MOVE, 6, 6),
  ];
  const pick = pickHarvestTarget(at(0, 0), parts);
  assert.equal(pick.id, "mv");
});

test("pickHarvestTarget: distance breaks ties between same priority", () => {
  const parts = [
    part("far", PART.MOVE, 50, 50),
    part("close", PART.MOVE, 5, 5),
  ];
  const pick = pickHarvestTarget(at(0, 0), parts);
  assert.equal(pick.id, "close");
});

test("pickHarvestTarget: prefers nearby low-priority over very-distant high-priority", () => {
  // RANGED_ATTACK very close beats MOVE very far if the distance gap exceeds the priority gap.
  const parts = [
    part("close-attack", PART.ATTACK, 2, 2),  // priority 2, dist 2 → score 18
    part("far-move", PART.MOVE, 80, 80),       // priority 5, dist 80 → score -30
  ];
  const pick = pickHarvestTarget(at(0, 0), parts);
  assert.equal(pick.id, "close-attack");
});

test("pickHarvestTarget: ignores unknown part types (priority 0)", () => {
  const parts = [
    part("unknown", "something_strange", 5, 5),
    part("heal", PART.HEAL, 10, 10),
  ];
  const pick = pickHarvestTarget(at(0, 0), parts);
  assert.equal(pick.id, "heal");
});

// shouldHarvest

test("shouldHarvest: true under stable conditions", () => {
  const snap = {
    myFlags: [{}, {}],
    bodyParts: [{}, {}],
    myCreeps: Array(12).fill({}),
  };
  assert.equal(shouldHarvest(snap), true);
});

test("shouldHarvest: false if myFlags < 2", () => {
  const snap = {
    myFlags: [{}],
    bodyParts: [{}],
    myCreeps: Array(12).fill({}),
  };
  assert.equal(shouldHarvest(snap), false);
});

test("shouldHarvest: false if no body parts", () => {
  const snap = {
    myFlags: [{}, {}],
    bodyParts: [],
    myCreeps: Array(12).fill({}),
  };
  assert.equal(shouldHarvest(snap), false);
});

test("shouldHarvest: false if not enough spare creeps", () => {
  const snap = {
    myFlags: [{}, {}],
    bodyParts: [{}],
    myCreeps: Array(5).fill({}),
  };
  assert.equal(shouldHarvest(snap), false);
});

test("shouldHarvest: explicit options override defaults", () => {
  const snap = {
    myFlags: [{}, {}],
    bodyParts: [{}],
    myCreeps: Array(5).fill({}),
  };
  assert.equal(shouldHarvest(snap, { minSpareCreeps: 4 }), true);
});
