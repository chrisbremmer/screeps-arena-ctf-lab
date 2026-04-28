import { test } from "node:test";
import assert from "node:assert/strict";
import { assignPincer } from "../src/commander/plays/pincer.mjs";
import { assignContestFlag } from "../src/commander/plays/contest-flag.mjs";
import { pickTarget } from "../src/intel/target.mjs";
import { ROLE } from "../src/intel/body.mjs";
import { flagInsideTowerRange } from "../src/intel/flags.mjs";

const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

const homeFlag = { x: 96, y: 96, id: "home" };
const enemyFlag = { x: 3, y: 3, id: "enemy" };
const enemyTower = { x: 2, y: 2, id: "enemyTower" };
const closeNeutral = { x: 84, y: 15, id: "neutralNE" };
const farNeutral = { x: 16, y: 83, id: "neutralSW" };

const makeSnap = (over = {}) => ({
  myFlags: [homeFlag],
  enemyFlags: [enemyFlag],
  neutralFlags: [closeNeutral, farNeutral],
  captureTargets: [enemyFlag, closeNeutral, farNeutral],
  myTowers: [],
  enemyTowers: [enemyTower],
  myCreeps: [],
  enemyCreeps: [],
  range: cheb,
  findClosestByPath: (anchor, items) => {
    if (!items || items.length === 0) return null;
    let best = items[0];
    let bestD = cheb(anchor, best);
    for (const i of items) {
      const d = cheb(anchor, i);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  },
  ...over,
});

// flagInsideTowerRange

test("flagInsideTowerRange: enemy home flag is inside their tower range", () => {
  const snap = makeSnap();
  assert.equal(flagInsideTowerRange(enemyFlag, snap.enemyTowers, snap, 20), true);
});

test("flagInsideTowerRange: a far neutral is outside enemy tower range", () => {
  const snap = makeSnap();
  assert.equal(flagInsideTowerRange(closeNeutral, snap.enemyTowers, snap, 20), false);
});

test("flagInsideTowerRange: empty towers list → false", () => {
  assert.equal(flagInsideTowerRange(enemyFlag, [], null, 20), false);
});

// assignContestFlag — tower-zone filter

test("contest-flag: prefers candidates outside enemy tower range", () => {
  const squad = { members: [{ x: 90, y: 90 }], centroid: { x: 90, y: 90 } };
  const snap = makeSnap();
  assignContestFlag(squad, snap);
  // Enemy flag at (3,3) is in tower range — should be filtered out. Among
  // the two safe neutrals, the closer-by-Chebyshev one wins (neutralSW = 74,
  // neutralNE = 75). The point of the test is "didn't pick the tower-zone
  // candidate," not which neutral specifically.
  assert.notEqual(squad.advanceTarget, enemyFlag);
  assert.ok([closeNeutral, farNeutral].includes(squad.advanceTarget));
});

test("contest-flag: falls back to tower-zone target if no safe option", () => {
  const squad = { members: [{ x: 5, y: 5 }], centroid: { x: 5, y: 5 } };
  const snap = makeSnap({
    captureTargets: [enemyFlag], // only candidate is in tower zone
    neutralFlags: [],
  });
  assignContestFlag(squad, snap);
  assert.equal(squad.advanceTarget, enemyFlag);
});

// assignPincer

test("pincer: picks the candidate that ISN'T main's target", () => {
  const squad = { members: [{ x: 95, y: 95 }], centroid: { x: 95, y: 95 } };
  const snap = makeSnap();
  // Main is heading for the close neutral.
  assignPincer(squad, snap, closeNeutral);
  assert.equal(squad.advanceTarget?.id, "neutralSW");
  assert.equal(squad.objective?.kind, "pincer-capture");
});

test("pincer: skips tower-zone candidates", () => {
  const squad = { members: [{ x: 95, y: 95 }], centroid: { x: 95, y: 95 } };
  const snap = makeSnap();
  // mainTarget is one neutral; pincer should not pick the enemy home (in
  // tower zone) — should pick the OTHER neutral.
  assignPincer(squad, snap, closeNeutral);
  assert.notEqual(squad.advanceTarget, enemyFlag);
});

test("pincer: with no mainTarget, picks any non-tower-zone candidate", () => {
  const squad = { members: [{ x: 95, y: 95 }], centroid: { x: 95, y: 95 } };
  const snap = makeSnap();
  assignPincer(squad, snap, null);
  assert.notEqual(squad.advanceTarget, enemyFlag);
});

test("pincer: no candidates → fall back to home flag", () => {
  const squad = { members: [{ x: 95, y: 95 }], centroid: { x: 95, y: 95 } };
  const snap = makeSnap({
    captureTargets: [enemyFlag], // only target is in tower zone → filtered
    neutralFlags: [],
  });
  assignPincer(squad, snap, null);
  // After tower-zone filter the candidate set is empty → fall back to home.
  assert.equal(squad.advanceTarget, homeFlag);
  assert.equal(squad.objective?.kind, "pincer-fallback");
});

test("pincer: empty squad → no-op", () => {
  const squad = { members: [] };
  const snap = makeSnap();
  assignPincer(squad, snap, null);
  // Should not throw, target stays unset.
  assert.equal(squad.advanceTarget, undefined);
});

// pickTarget — heavier healer priority (regression for the v8 weight bump)

const c = (id, hits, hitsMax, role = ROLE.RANGER) => ({ id, hits, hitsMax, _role: role });

test("pickTarget: full-HP healer beats 50%-HP non-healer (v8 weight)", () => {
  // hpPct healer = 1.0 - 0.6 = 0.4. hpPct ranger = 0.5. Healer wins.
  const ranger = c("r", 50, 100, ROLE.RANGER);
  const healer = c("h", 100, 100, ROLE.HEALER);
  assert.equal(pickTarget([ranger, healer]).id, "h");
});

test("pickTarget: very-low-HP non-healer still wins over healthy healer", () => {
  // hpPct ranger = 0.05. hpPct healer = 1.0 - 0.6 = 0.4. Ranger wins.
  const ranger = c("r", 5, 100, ROLE.RANGER);
  const healer = c("h", 100, 100, ROLE.HEALER);
  assert.equal(pickTarget([ranger, healer]).id, "r");
});

test("pickTarget: equal-HP, healer always wins", () => {
  const ranger = c("r", 80, 100, ROLE.RANGER);
  const healer = c("h", 80, 100, ROLE.HEALER);
  assert.equal(pickTarget([ranger, healer]).id, "h");
});
