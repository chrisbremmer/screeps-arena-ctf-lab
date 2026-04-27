import { test } from "node:test";
import assert from "node:assert/strict";
import { pickTowerTarget } from "../src/commander/plays/operate-towers.mjs";

const tower = { x: 2, y: 2, id: "t1" };
const enemy = (id, x, y, hits, hitsMax = 1200) => ({ id, x, y, hits, hitsMax });

const range = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const snap = { range };

test("pickTowerTarget: null → null", () => {
  assert.equal(pickTowerTarget(tower, null, snap), null);
  assert.equal(pickTowerTarget(tower, [], snap), null);
});

test("pickTowerTarget: lowest HP wins", () => {
  const a = enemy("a", 5, 5, 1000); // 0.83 HP
  const b = enemy("b", 5, 5, 200);  // 0.17 HP
  assert.equal(pickTowerTarget(tower, [a, b], snap).id, "b");
});

test("pickTowerTarget: range tie-break — closer wins among same HP", () => {
  const close = enemy("close", 4, 4, 600); // range 2
  const far = enemy("far", 15, 15, 600);   // range 13
  assert.equal(pickTowerTarget(tower, [close, far], snap).id, "close");
});

test("pickTowerTarget: very low HP beats healthy nearby", () => {
  const dying = enemy("dying", 20, 20, 50);   // ~0.04 HP, range 18
  const healthy = enemy("healthy", 4, 4, 1200); // 1.0 HP, range 2
  assert.equal(pickTowerTarget(tower, [dying, healthy], snap).id, "dying");
});
