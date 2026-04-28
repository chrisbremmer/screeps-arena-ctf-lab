import { test } from "node:test";
import assert from "node:assert/strict";
import { squadMoveTarget } from "../src/squads/formation.mjs";

const advanceTarget = { x: 50, y: 50, id: "advance" };
const centroid = { x: 10, y: 10, id: "centroid" };

const inRange = (anchor, items, range) =>
  items.filter((i) => Math.max(Math.abs(i.x - anchor.x), Math.abs(i.y - anchor.y)) <= range);

const snap = (enemies = []) => ({
  enemyCreeps: enemies,
  findInRange: (anchor, items, range) => inRange(anchor, items, range),
});

const sprawled = (over = {}) => ({
  advanceTarget,
  centroid,
  spread: 15,
  cohesionEnforced: true,
  members: [{ x: 10, y: 10 }],
  looseAdvance: true,
  contactRange: 8,
  ...over,
});

// Backwards-compat: existing calls without snapshot still work.

test("squadMoveTarget: no snapshot + sprawled → centroid (legacy behaviour)", () => {
  const squad = { advanceTarget, centroid, spread: 15, cohesionEnforced: true };
  assert.equal(squadMoveTarget(squad).id, "centroid");
});

// Loose-advance mode.

test("looseAdvance: sprawled + no enemies → advance target (don't converge)", () => {
  const dest = squadMoveTarget(sprawled(), snap([]));
  assert.equal(dest.id, "advance");
});

test("looseAdvance: sprawled + enemy within contactRange → centroid (converge)", () => {
  // Member at (10,10), enemy at (15,10) is 5 tiles away (< 8).
  const dest = squadMoveTarget(sprawled(), snap([{ x: 15, y: 10 }]));
  assert.equal(dest.id, "centroid");
});

test("looseAdvance: sprawled + enemy outside contactRange → advance target", () => {
  // Member at (10,10), enemy at (50,50) is 40 tiles away (> 8).
  const dest = squadMoveTarget(sprawled(), snap([{ x: 50, y: 50 }]));
  assert.equal(dest.id, "advance");
});

test("looseAdvance: contactRange tunable per squad", () => {
  const squad = sprawled({ contactRange: 3 });
  // Enemy at distance 5 is outside contactRange 3 → advance.
  assert.equal(squadMoveTarget(squad, snap([{ x: 15, y: 10 }])).id, "advance");
  // Enemy at distance 2 is inside contactRange 3 → centroid.
  assert.equal(squadMoveTarget(squad, snap([{ x: 12, y: 10 }])).id, "centroid");
});

test("looseAdvance off + sprawled → centroid regardless of enemies", () => {
  const squad = sprawled({ looseAdvance: false });
  // Even with no enemies, classic cohesion converges to centroid.
  assert.equal(squadMoveTarget(squad, snap([])).id, "centroid");
});

test("looseAdvance: spread within radius → advance (cohesion never engaged)", () => {
  const squad = sprawled({ spread: 5 });
  // Even with enemy in contact, no convergence because spread is fine.
  assert.equal(squadMoveTarget(squad, snap([{ x: 11, y: 10 }])).id, "advance");
});

test("looseAdvance: any member in contact triggers convergence (not just leader)", () => {
  const squad = sprawled({
    members: [
      { x: 10, y: 10 },   // safe
      { x: 50, y: 50 },   // forward, no enemy nearby
      { x: 30, y: 30 },   // forward — enemy is 4 tiles from this one
    ],
  });
  const dest = squadMoveTarget(squad, snap([{ x: 34, y: 30 }]));
  assert.equal(dest.id, "centroid");
});
