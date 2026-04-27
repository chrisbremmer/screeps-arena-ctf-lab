// Ranger micro: shoot what we can, kite if too close, advance otherwise.

import { moveToward, stepAway } from "./move.mjs";
import { pickTarget } from "../intel/target.mjs";
import { KITE_RANGE, RANGED_ATTACK_RANGE } from "../arena/rules.mjs";
import { squadMoveTarget } from "../squads/formation.mjs";

export function runRanger(creep, snapshot, squad) {
  const inRange = snapshot.findInRange(creep, snapshot.enemyCreeps, RANGED_ATTACK_RANGE);
  const target = pickTarget(inRange);
  if (target) creep.rangedAttack(target);

  // Threat-driven positioning: if any enemy is within KITE_RANGE - 1, step back.
  const tooClose = snapshot.findInRange(creep, snapshot.enemyCreeps, KITE_RANGE - 1);
  if (tooClose.length > 0) {
    stepAway(creep, snapshot.findClosestByRange(creep, tooClose));
    return;
  }

  const dest = squadMoveTarget(squad);
  if (dest) moveToward(creep, dest);
}
