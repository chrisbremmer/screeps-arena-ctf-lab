import { test } from "node:test";
import assert from "node:assert/strict";
import { pickTarget } from "../src/intel/target.mjs";
import { ROLE } from "../src/intel/body.mjs";

const c = (id, hits, hitsMax, role = ROLE.RANGER) => ({ id, hits, hitsMax, _role: role });

test("pickTarget: empty → null", () => {
  assert.equal(pickTarget([]), null);
  assert.equal(pickTarget(null), null);
});

test("pickTarget: lowest HP percentage wins", () => {
  const a = c("a", 80, 100); // 0.8
  const b = c("b", 30, 100); // 0.3
  const d = c("d", 70, 100); // 0.7
  assert.equal(pickTarget([a, b, d]).id, "b");
});

test("pickTarget: healer beats equal-HP non-healer via tiebreaker", () => {
  const a = c("a", 50, 100, ROLE.RANGER);
  const b = c("b", 50, 100, ROLE.HEALER);
  assert.equal(pickTarget([a, b]).id, "b");
});

test("pickTarget: very low non-healer beats healthy healer", () => {
  const a = c("a", 5, 100, ROLE.RANGER);   // 0.05
  const b = c("b", 90, 100, ROLE.HEALER);  // 0.90 - 0.10 = 0.80
  assert.equal(pickTarget([a, b]).id, "a");
});
