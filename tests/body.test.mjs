import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyRole, countParts, isMoveBalancedOnPlain, ROLE } from "../src/intel/body.mjs";

const fakeCreep = (parts) => ({ body: parts.map((type) => ({ type })) });

test("classifyRole: HEAL part wins", () => {
  const c = fakeCreep(["heal", "ranged_attack", "move", "move"]);
  assert.equal(classifyRole(c), ROLE.HEALER);
});

test("classifyRole: RANGED_ATTACK over ATTACK", () => {
  const c = fakeCreep(["ranged_attack", "attack", "move", "move"]);
  assert.equal(classifyRole(c), ROLE.RANGER);
});

test("classifyRole: ATTACK only → melee", () => {
  const c = fakeCreep(["attack", "attack", "move", "move"]);
  assert.equal(classifyRole(c), ROLE.MELEE);
});

test("classifyRole: empty role parts → unknown", () => {
  const c = fakeCreep(["move", "move"]);
  assert.equal(classifyRole(c), ROLE.UNKNOWN);
});

test("countParts: handles repeated types", () => {
  const c = fakeCreep(["move", "move", "ranged_attack", "ranged_attack"]);
  const counts = countParts(c);
  assert.equal(counts.move, 2);
  assert.equal(counts.ranged_attack, 2);
  assert.equal(counts.heal, 0);
});

test("isMoveBalancedOnPlain: 4 move + 4 ranged is balanced", () => {
  const c = fakeCreep([
    "move", "move", "move", "move",
    "ranged_attack", "ranged_attack", "ranged_attack", "ranged_attack",
  ]);
  assert.equal(isMoveBalancedOnPlain(c), true);
});

test("isMoveBalancedOnPlain: 2 move + 4 ranged is unbalanced", () => {
  const c = fakeCreep([
    "move", "move",
    "ranged_attack", "ranged_attack", "ranged_attack", "ranged_attack",
  ]);
  assert.equal(isMoveBalancedOnPlain(c), false);
});
