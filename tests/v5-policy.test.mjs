import { test } from "node:test";
import assert from "node:assert/strict";
import { detectRushedFlag, defendOrPush } from "../src/commander/plays/defend-or-push.mjs";

const homeTower = { x: 2, y: 2 };
const homeFlag = { x: 3, y: 3, id: "home" };
const closeNeutral = { x: 16, y: 83, id: "neutralSW" };
const farNeutral = { x: 84, y: 15, id: "neutralNE" };
const enemyFlag = { x: 96, y: 96, id: "enemy" };

const creep = (n, near = { x: 50, y: 50 }) =>
  Array.from({ length: n }, (_, i) => ({ x: near.x + i, y: near.y, id: `c${i}` }));

const inRange = (anchor, items, range) =>
  items.filter((i) => Math.max(Math.abs(i.x - anchor.x), Math.abs(i.y - anchor.y)) <= range);

const makeSnapshot = (overrides = {}) => ({
  myFlags: [homeFlag, closeNeutral],
  enemyFlags: [enemyFlag],
  neutralFlags: [farNeutral],
  captureTargets: [enemyFlag, farNeutral],
  myTowers: [homeTower],
  myCreeps: creep(12, { x: 16, y: 83 }),
  enemyCreeps: [],
  findClosestByPath: (anchor, items) => items[0] ?? null,
  findInRange: (anchor, items, range) => inRange(anchor, items, range),
  ...overrides,
});

// detectRushedFlag

test("detectRushedFlag: no enemies nearby → null", () => {
  const snap = makeSnapshot({ enemyCreeps: [] });
  assert.equal(detectRushedFlag(snap), null);
});

test("detectRushedFlag: 3 enemies near home (under threshold) → null", () => {
  const snap = makeSnapshot({ enemyCreeps: creep(3, { x: 5, y: 5 }) });
  assert.equal(detectRushedFlag(snap), null);
});

test("detectRushedFlag: 4 enemies near captured neutral → returns it", () => {
  const snap = makeSnapshot({ enemyCreeps: creep(4, { x: 18, y: 85 }) });
  const flag = detectRushedFlag(snap);
  assert.equal(flag?.id, "neutralSW");
});

test("detectRushedFlag: 4 enemies near home → returns home", () => {
  const snap = makeSnapshot({ enemyCreeps: creep(4, { x: 5, y: 5 }) });
  const flag = detectRushedFlag(snap);
  assert.equal(flag?.id, "home");
});

test("detectRushedFlag: equal threats → home wins (game-over weighting)", () => {
  // 4 enemies near home, 4 near captured neutral.
  const enemies = [
    ...creep(4, { x: 5, y: 5 }),
    ...creep(4, { x: 18, y: 85 }).map((c, i) => ({ ...c, id: `n${i}` })),
  ];
  const snap = makeSnapshot({ enemyCreeps: enemies });
  const flag = detectRushedFlag(snap);
  assert.equal(flag?.id, "home");
});

test("detectRushedFlag: bigger threat at neutral wins over smaller at home", () => {
  // 4 enemies at home (effective 5 with home bias), 6 at neutral (effective 6).
  const enemies = [
    ...creep(4, { x: 5, y: 5 }).map((c, i) => ({ ...c, id: `h${i}` })),
    ...creep(6, { x: 18, y: 85 }).map((c, i) => ({ ...c, id: `n${i}` })),
  ];
  const snap = makeSnapshot({ enemyCreeps: enemies });
  const flag = detectRushedFlag(snap);
  assert.equal(flag?.id, "neutralSW");
});

test("detectRushedFlag: explicit threshold tunes sensitivity", () => {
  const snap = makeSnapshot({ enemyCreeps: creep(3, { x: 5, y: 5 }) });
  // Threshold 3 → trigger
  assert.equal(detectRushedFlag(snap, { rushThreshold: 3 })?.id, "home");
  // Threshold 5 → no trigger
  assert.equal(detectRushedFlag(snap, { rushThreshold: 5 }), null);
});

test("detectRushedFlag: explicit range tunes detection radius", () => {
  const snap = makeSnapshot({ enemyCreeps: creep(4, { x: 30, y: 30 }) });
  // Default range 25 — enemies at distance ~27 from home, so detect home
  // (and bias). Tighter range 10 → no trigger.
  assert.equal(detectRushedFlag(snap, { rushRange: 10 }), null);
});

// defendOrPush

test("defendOrPush: rush detected → recall to that flag", () => {
  const squad = { members: creep(12) };
  const snap = makeSnapshot({ enemyCreeps: creep(4, { x: 18, y: 85 }) });
  defendOrPush(squad, snap);
  assert.equal(squad.objective?.kind, "rush-defense");
  assert.equal(squad.advanceTarget?.id, "neutralSW");
});

test("defendOrPush: no rush → falls through to push/hold", () => {
  const squad = { members: creep(12) };
  // 12 vs 8 alive, 2 flags — should trigger push.
  const snap = makeSnapshot({
    enemyCreeps: creep(8, { x: 80, y: 80 }),  // far from any my-flag
    myCreeps: creep(12, { x: 16, y: 83 }),
  });
  defendOrPush(squad, snap);
  assert.notEqual(squad.objective?.kind, "rush-defense");
});

test("defendOrPush: rush trumps push even with material advantage", () => {
  const squad = { members: creep(12) };
  const snap = makeSnapshot({
    enemyCreeps: [
      ...creep(4, { x: 5, y: 5 }).map((c, i) => ({ ...c, id: `r${i}` })),
      ...creep(4, { x: 80, y: 80 }).map((c, i) => ({ ...c, id: `f${i}` })),
    ],
    myCreeps: creep(14, { x: 16, y: 83 }),
  });
  defendOrPush(squad, snap);
  assert.equal(squad.objective?.kind, "rush-defense");
  assert.equal(squad.advanceTarget?.id, "home");
});
