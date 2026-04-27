import { test } from "node:test";
import assert from "node:assert/strict";
import { pushOnMaterialAdvantage } from "../src/commander/plays/push-on-material-advantage.mjs";

const homeTower = { x: 2, y: 2 };
const homeFlag = { x: 3, y: 3, id: "home" };
const closeNeutral = { x: 16, y: 83, id: "neutralSW" };
const farNeutral = { x: 84, y: 15, id: "neutralNE" };
const enemyFlag = { x: 96, y: 96, id: "enemy" };

const creep = (n) => Array.from({ length: n }, (_, i) => ({ x: 5, y: 5, id: `c${i}` }));

const makeSnapshot = (overrides = {}) => ({
  myFlags: [],
  enemyFlags: [enemyFlag],
  neutralFlags: [closeNeutral, farNeutral],
  captureTargets: [enemyFlag, closeNeutral, farNeutral],
  myTowers: [homeTower],
  myCreeps: creep(14),
  enemyCreeps: creep(14),
  findClosestByPath: (anchor, items) =>
    [...items].sort((a, b) => {
      const da = Math.max(Math.abs(a.x - anchor.x), Math.abs(a.y - anchor.y));
      const db = Math.max(Math.abs(b.x - anchor.x), Math.abs(b.y - anchor.y));
      return da - db;
    })[0],
  ...overrides,
});

test("pushOnMaterialAdvantage: 1 flag → contest", () => {
  const squad = { members: creep(14) };
  const snap = makeSnapshot({ myFlags: [homeFlag] });
  pushOnMaterialAdvantage(squad, snap);
  assert.notEqual(squad.advanceTarget, null);
  assert.notEqual(squad.objective?.kind, "hold-captured-flag");
  assert.notEqual(squad.objective?.kind, "push-with-advantage");
});

test("pushOnMaterialAdvantage: 2 flags, advantage 0 → hold", () => {
  const squad = { members: creep(10) };
  const snap = makeSnapshot({
    myFlags: [homeFlag, closeNeutral],
    captureTargets: [enemyFlag, farNeutral],
    myCreeps: creep(10),
    enemyCreeps: creep(10),
  });
  pushOnMaterialAdvantage(squad, snap);
  assert.equal(squad.objective?.kind, "hold-captured-flag");
  assert.equal(squad.advanceTarget?.id, "neutralSW");
});

test("pushOnMaterialAdvantage: 2 flags, advantage 3 (just under) → hold", () => {
  const squad = { members: creep(10) };
  const snap = makeSnapshot({
    myFlags: [homeFlag, closeNeutral],
    captureTargets: [enemyFlag, farNeutral],
    myCreeps: creep(10),
    enemyCreeps: creep(7),
  });
  pushOnMaterialAdvantage(squad, snap);
  assert.equal(squad.objective?.kind, "hold-captured-flag");
});

test("pushOnMaterialAdvantage: 2 flags, advantage 4 (at threshold) → push", () => {
  const squad = { members: creep(12) };
  const snap = makeSnapshot({
    myFlags: [homeFlag, closeNeutral],
    captureTargets: [enemyFlag, farNeutral],
    myCreeps: creep(12),
    enemyCreeps: creep(8),
  });
  pushOnMaterialAdvantage(squad, snap);
  assert.equal(squad.objective?.kind, "push-with-advantage");
  assert.equal(squad.objective.advantage, 4);
});

test("pushOnMaterialAdvantage: 2 flags, big advantage → push", () => {
  const squad = { members: creep(12) };
  const snap = makeSnapshot({
    myFlags: [homeFlag, closeNeutral],
    captureTargets: [enemyFlag, farNeutral],
    myCreeps: creep(12),
    enemyCreeps: creep(2),
  });
  pushOnMaterialAdvantage(squad, snap);
  assert.equal(squad.objective?.kind, "push-with-advantage");
  assert.equal(squad.objective.advantage, 10);
});

test("pushOnMaterialAdvantage: 3 flags → hold (tick-out winning, no need to push)", () => {
  const squad = { members: creep(8) };
  const snap = makeSnapshot({
    myFlags: [homeFlag, closeNeutral, farNeutral],
    enemyFlags: [enemyFlag],
    neutralFlags: [],
    captureTargets: [enemyFlag],
    myCreeps: creep(8),
    enemyCreeps: creep(2),
  });
  pushOnMaterialAdvantage(squad, snap);
  assert.equal(squad.objective?.kind, "hold-with-flag-lead");
});

test("pushOnMaterialAdvantage: explicit threshold overrides default", () => {
  const squad = { members: creep(12) };
  const snap = makeSnapshot({
    myFlags: [homeFlag, closeNeutral],
    captureTargets: [enemyFlag, farNeutral],
    myCreeps: creep(12),
    enemyCreeps: creep(8),
  });
  // With threshold 6, advantage 4 should not push.
  pushOnMaterialAdvantage(squad, snap, { threshold: 6 });
  assert.equal(squad.objective?.kind, "hold-captured-flag");
});

test("pushOnMaterialAdvantage: 2 flags, we're losing material → hold", () => {
  const squad = { members: creep(5) };
  const snap = makeSnapshot({
    myFlags: [homeFlag, closeNeutral],
    captureTargets: [enemyFlag, farNeutral],
    myCreeps: creep(5),
    enemyCreeps: creep(11),
  });
  pushOnMaterialAdvantage(squad, snap);
  assert.equal(squad.objective?.kind, "hold-captured-flag");
});
