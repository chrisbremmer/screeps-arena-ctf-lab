import { test } from "node:test";
import assert from "node:assert/strict";
import { centroid, maxSpread } from "../src/squads/formation.mjs";

test("centroid: empty group → null", () => {
  assert.equal(centroid([]), null);
});

test("centroid: single creep → its position", () => {
  assert.deepEqual(centroid([{ x: 4, y: 7 }]), { x: 4, y: 7 });
});

test("centroid: averaged and rounded", () => {
  const g = [{ x: 1, y: 1 }, { x: 3, y: 3 }, { x: 5, y: 5 }];
  assert.deepEqual(centroid(g), { x: 3, y: 3 });
});

test("maxSpread: single creep → 0", () => {
  assert.equal(maxSpread([{ x: 1, y: 1 }]), 0);
});

test("maxSpread: chebyshev distance, not euclidean", () => {
  // (0,0) to (5,3) — Chebyshev is 5, Euclidean would be ~5.83.
  const g = [{ x: 0, y: 0 }, { x: 5, y: 3 }];
  assert.equal(maxSpread(g), 5);
});

test("maxSpread: takes the worst pair", () => {
  const g = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 8, y: 2 }];
  assert.equal(maxSpread(g), 8);
});
