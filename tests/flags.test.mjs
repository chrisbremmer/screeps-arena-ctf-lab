import { test } from "node:test";
import assert from "node:assert/strict";
import { findHomeFlag, findCapturedFlag } from "../src/intel/flags.mjs";

const snap = (myFlags = [], myTowers = [{ x: 2, y: 2 }]) => ({ myFlags, myTowers });

test("findHomeFlag: empty flags → null", () => {
  assert.equal(findHomeFlag(snap([])), null);
});

test("findHomeFlag: no tower → null", () => {
  assert.equal(findHomeFlag(snap([{ x: 3, y: 3 }], [])), null);
});

test("findHomeFlag: returns the flag closest to the home tower", () => {
  // home flag at (3,3) is 1 tile from tower (2,2); captured neutral at (16,83) is 81 away.
  const flags = [{ x: 16, y: 83, id: "neutral" }, { x: 3, y: 3, id: "home" }];
  const home = findHomeFlag(snap(flags));
  assert.equal(home.id, "home");
});

test("findCapturedFlag: <2 flags → null", () => {
  assert.equal(findCapturedFlag(snap([{ x: 3, y: 3 }])), null);
  assert.equal(findCapturedFlag(snap([])), null);
});

test("findCapturedFlag: returns the farthest flag from home tower", () => {
  const flags = [{ x: 3, y: 3, id: "home" }, { x: 16, y: 83, id: "captured" }];
  const captured = findCapturedFlag(snap(flags));
  assert.equal(captured.id, "captured");
});

test("findCapturedFlag: with 3 owned flags, returns the most distant non-home", () => {
  const flags = [
    { x: 3, y: 3, id: "home" },
    { x: 16, y: 83, id: "neutralSW" }, // distance ~81
    { x: 84, y: 15, id: "neutralNE" }, // distance ~82
  ];
  const captured = findCapturedFlag(snap(flags));
  assert.equal(captured.id, "neutralNE");
});
