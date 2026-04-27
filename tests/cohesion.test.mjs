import { test } from "node:test";
import assert from "node:assert/strict";
import { squadMoveTarget } from "../src/squads/formation.mjs";

const advanceTarget = { x: 50, y: 50, id: "advance" };
const centroid = { x: 10, y: 10, id: "centroid" };

test("squadMoveTarget: null squad → null", () => {
  assert.equal(squadMoveTarget(null), null);
  assert.equal(squadMoveTarget(undefined), null);
});

test("squadMoveTarget: cohesion off → returns advanceTarget", () => {
  const squad = { advanceTarget, centroid, spread: 99, cohesionEnforced: false };
  assert.equal(squadMoveTarget(squad).id, "advance");
});

test("squadMoveTarget: cohesion on, spread within radius → advance", () => {
  const squad = { advanceTarget, centroid, spread: 3, cohesionEnforced: true };
  assert.equal(squadMoveTarget(squad).id, "advance");
});

test("squadMoveTarget: cohesion on, spread above radius → centroid", () => {
  const squad = { advanceTarget, centroid, spread: 10, cohesionEnforced: true };
  assert.equal(squadMoveTarget(squad).id, "centroid");
});

test("squadMoveTarget: cohesion on, spread at exactly radius → advance (>, not ≥)", () => {
  const squad = { advanceTarget, centroid, spread: 3, cohesionEnforced: true };
  assert.equal(squadMoveTarget(squad).id, "advance");
});

test("squadMoveTarget: cohesion on but no centroid (empty squad) → advance", () => {
  const squad = { advanceTarget, centroid: null, spread: 99, cohesionEnforced: true };
  assert.equal(squadMoveTarget(squad).id, "advance");
});

test("squadMoveTarget: cohesion on, no advance, sprawled → centroid", () => {
  const squad = { advanceTarget: null, centroid, spread: 10, cohesionEnforced: true };
  assert.equal(squadMoveTarget(squad).id, "centroid");
});
