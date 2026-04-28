// Melee micro: stay with the squad, engage enemies adjacent to us, otherwise advance.

import { moveToward } from "./move.mjs";
import { pickTarget } from "../intel/target.mjs";
import { MELEE_RANGE } from "../arena/rules.mjs";
import { squadMoveTarget } from "../squads/formation.mjs";

export function runMelee(creep, snapshot, squad) {
  const adjacent = snapshot.findInRange(creep, snapshot.enemyCreeps, MELEE_RANGE);
  const target = pickTarget(adjacent);
  if (target) {
    creep.attack(target);
    return;
  }

  // No-one in melee range. If the squad is in cohesion mode, prioritize closing
  // ranks over chasing the closest enemy — chasing is what got isolated melee
  // creeps killed in v0/v1. Otherwise close on the nearest enemy.
  const cohesionDest = squadMoveTarget(squad, snapshot);
  if (squad?.cohesionEnforced && cohesionDest) {
    moveToward(creep, cohesionDest, snapshot);
    return;
  }
  const nearby = snapshot.findClosestByPath(creep, snapshot.enemyCreeps);
  const dest = nearby || cohesionDest;
  if (dest) moveToward(creep, dest, snapshot);
}
