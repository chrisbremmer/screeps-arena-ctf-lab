import { test } from "node:test";
import assert from "node:assert/strict";
import { holdAtTwoFlags } from "../src/commander/plays/hold-at-two-flags.mjs";

const homeTower = { x: 2, y: 2 };
const homeFlag = { x: 3, y: 3, id: "home" };
const closeNeutral = { x: 16, y: 83, id: "neutralSW" };
const farNeutral = { x: 84, y: 15, id: "neutralNE" };
const enemyFlag = { x: 96, y: 96, id: "enemy" };

const makeSnapshot = (overrides = {}) => ({
  myFlags: [],
  enemyFlags: [enemyFlag],
  neutralFlags: [closeNeutral, farNeutral],
  captureTargets: [enemyFlag, closeNeutral, farNeutral],
  myTowers: [homeTower],
  myCreeps: [{ x: 5, y: 5 }],
  findClosestByPath: (anchor, items) => {
    // Pick the flag with smallest Chebyshev to anchor.
    return [...items].sort((a, b) => {
      const da = Math.max(Math.abs(a.x - anchor.x), Math.abs(a.y - anchor.y));
      const db = Math.max(Math.abs(b.x - anchor.x), Math.abs(b.y - anchor.y));
      return da - db;
    })[0];
  },
  ...overrides,
});

test("holdAtTwoFlags: with 1 flag (home only), defers to contest", () => {
  const squad = { members: [{ x: 5, y: 5 }] };
  const snap = makeSnapshot({
    myFlags: [homeFlag],
    enemyFlags: [enemyFlag],
    neutralFlags: [closeNeutral, farNeutral],
    captureTargets: [enemyFlag, closeNeutral, farNeutral],
  });
  holdAtTwoFlags(squad, snap);
  // Contest-flag picks closest non-our; from (5,5) the close neutral at (16,83) is closest of the three? Actually let me check.
  // Distances from (5,5):
  //   enemy (96,96):     91
  //   neutralSW (16,83): 78
  //   neutralNE (84,15): 79
  // Closest = neutralSW.
  assert.equal(squad.advanceTarget?.id, "neutralSW");
});

test("holdAtTwoFlags: with 2 flags (home + close neutral), anchors on captured neutral", () => {
  const squad = { members: [{ x: 5, y: 5 }] };
  const snap = makeSnapshot({
    myFlags: [homeFlag, closeNeutral],
    enemyFlags: [enemyFlag],
    neutralFlags: [farNeutral],
    captureTargets: [enemyFlag, farNeutral],
  });
  holdAtTwoFlags(squad, snap);
  assert.equal(squad.advanceTarget?.id, "neutralSW");
  assert.equal(squad.objective?.kind, "hold-captured-flag");
});

test("holdAtTwoFlags: with 2 flags (home + far neutral), anchors on far neutral", () => {
  const squad = { members: [{ x: 5, y: 5 }] };
  const snap = makeSnapshot({
    myFlags: [homeFlag, farNeutral],
    enemyFlags: [enemyFlag],
    neutralFlags: [closeNeutral],
    captureTargets: [enemyFlag, closeNeutral],
  });
  holdAtTwoFlags(squad, snap);
  assert.equal(squad.advanceTarget?.id, "neutralNE");
});

test("holdAtTwoFlags: with 0 flags (lost home), defers to contest to recapture", () => {
  const squad = { members: [{ x: 5, y: 5 }] };
  const snap = makeSnapshot({
    myFlags: [],
    enemyFlags: [enemyFlag, homeFlag],
    neutralFlags: [closeNeutral, farNeutral],
    captureTargets: [enemyFlag, homeFlag, closeNeutral, farNeutral],
  });
  holdAtTwoFlags(squad, snap);
  assert.notEqual(squad.advanceTarget, undefined);
  assert.notEqual(squad.advanceTarget, null);
  // Whatever contest picks (closest by path), it shouldn't be the "hold" objective.
  assert.notEqual(squad.objective?.kind, "hold-captured-flag");
});

test("holdAtTwoFlags: with 2 flags but no home tower (degenerate), defers to contest", () => {
  // findCapturedFlag returns null without a home tower; the policy should fall through.
  const squad = { members: [{ x: 5, y: 5 }] };
  const snap = makeSnapshot({
    myFlags: [homeFlag, closeNeutral],
    myTowers: [],
    enemyFlags: [enemyFlag],
    neutralFlags: [farNeutral],
    captureTargets: [enemyFlag, farNeutral],
  });
  holdAtTwoFlags(squad, snap);
  // Falls through to contest, which picks closest non-our.
  assert.notEqual(squad.objective?.kind, "hold-captured-flag");
});
