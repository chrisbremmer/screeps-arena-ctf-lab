import { test } from "node:test";
import assert from "node:assert/strict";
import { pickHealTarget } from "../src/commander/plays/operate-towers.mjs";

const tower = { x: 50, y: 50, id: "t1" };
const ally = (id, x, y, hits, hitsMax = 1200) => ({ id, x, y, hits, hitsMax });

const range = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const snap = { range };

// pickHealTarget — mirrors pickTowerTarget priority but for damaged allies.

test("pickHealTarget: null/empty → null", () => {
  assert.equal(pickHealTarget(tower, null, snap), null);
  assert.equal(pickHealTarget(tower, [], snap), null);
});

test("pickHealTarget: lowest HP wins", () => {
  const a = ally("a", 51, 51, 1000); // 0.83 HP
  const b = ally("b", 52, 52, 200);  // 0.17 HP
  assert.equal(pickHealTarget(tower, [a, b], snap).id, "b");
});

test("pickHealTarget: closer wins on equal HP (heal falloff is range-sensitive)", () => {
  const close = ally("close", 51, 51, 600); // range 1
  const far = ally("far", 60, 60, 600);     // range 10
  assert.equal(pickHealTarget(tower, [close, far], snap).id, "close");
});

test("pickHealTarget: very low HP at range beats healthy adjacent", () => {
  const dying = ally("dying", 65, 65, 50);     // 0.04 HP, range 15
  const healthy = ally("healthy", 51, 51, 1200); // 1.0 HP, range 1
  assert.equal(pickHealTarget(tower, [dying, healthy], snap).id, "dying");
});
