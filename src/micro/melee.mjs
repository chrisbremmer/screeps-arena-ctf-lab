// Melee micro: stay with the squad, engage enemies adjacent to us, otherwise advance.

import { moveToward } from "./move.mjs";
import { pickTarget } from "../intel/target.mjs";
import { MELEE_RANGE } from "../arena/rules.mjs";

export function runMelee(creep, snapshot, squad) {
  const adjacent = snapshot.findInRange(creep, snapshot.enemyCreeps, MELEE_RANGE);
  const target = pickTarget(adjacent);
  if (target) {
    creep.attack(target);
    return;
  }

  // No-one in melee range — close on the nearest enemy near our squad target,
  // or advance toward the squad's destination.
  const nearby = snapshot.findClosestByPath(creep, snapshot.enemyCreeps);
  const dest = nearby || squad?.advanceTarget;
  if (dest) moveToward(creep, dest);
}
