import { test } from "node:test";
import assert from "node:assert/strict";
import { pickSquadFocusTarget } from "../src/intel/target.mjs";
import { ROLE } from "../src/intel/body.mjs";

const enemy = (id, x, y, hits = 1000, hitsMax = 1200, role = ROLE.RANGER) => ({
  id, x, y, hits, hitsMax, _role: role,
});
const member = (id, x, y) => ({ id, x, y });

const range = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const snap = { range };

test("pickSquadFocusTarget: empty squad → null", () => {
  assert.equal(pickSquadFocusTarget([], [enemy("a", 0, 0)], snap), null);
});

test("pickSquadFocusTarget: empty enemies → null", () => {
  assert.equal(pickSquadFocusTarget([member("m", 0, 0)], [], snap), null);
});

test("pickSquadFocusTarget: picks lowest-HP enemy in range of any member", () => {
  const members = [member("m1", 0, 0), member("m2", 10, 10)];
  const enemies = [
    enemy("a", 2, 2, 1000),  // in range of m1, full hp
    enemy("b", 12, 12, 200), // in range of m2, low hp
  ];
  const target = pickSquadFocusTarget(members, enemies, snap, 3);
  assert.equal(target.id, "b");
});

test("pickSquadFocusTarget: ignores enemies outside range of all members", () => {
  const members = [member("m1", 0, 0)];
  const enemies = [
    enemy("a", 50, 50, 100), // very low HP but unreachable
  ];
  assert.equal(pickSquadFocusTarget(members, enemies, snap, 3), null);
});

test("pickSquadFocusTarget: deduplicates enemies seen via multiple members", () => {
  // Same enemy in range of both members shouldn't be considered twice.
  const members = [member("m1", 0, 0), member("m2", 1, 1)];
  const enemies = [enemy("a", 2, 2, 500)];
  const target = pickSquadFocusTarget(members, enemies, snap, 3);
  assert.equal(target.id, "a");
});

test("pickSquadFocusTarget: explicit range parameter widens consideration", () => {
  const members = [member("m1", 0, 0)];
  const enemies = [
    enemy("close", 2, 2, 1000),
    enemy("far", 5, 5, 100),
  ];
  // Range 3: only "close" considered.
  assert.equal(pickSquadFocusTarget(members, enemies, snap, 3).id, "close");
  // Range 5: "far" wins on lower HP.
  assert.equal(pickSquadFocusTarget(members, enemies, snap, 5).id, "far");
});
