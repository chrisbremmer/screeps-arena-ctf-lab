// Ranger micro: shoot what we can, kite if too close, advance otherwise.
//
// Mass-attack rule: when ≥2 enemies are in range, switch from single-target
// rangedAttack to rangedMassAttack. Per the docs, mass-attack delivers the
// same damage per target as single-target rangedAttack at each range tier
// (10/4/1 dmg per RANGED_ATTACK part at range 1/2/3) but hits ALL enemies
// in range — a free DPS multiplier in cohesion fights.

import { moveToward, stepAway } from "./move.mjs";
import { pickTarget } from "../intel/target.mjs";
import { KITE_RANGE, RANGED_ATTACK_RANGE } from "../arena/rules.mjs";
import { squadMoveTarget } from "../squads/formation.mjs";

export function runRanger(creep, snapshot, squad) {
  const inRange = snapshot.findInRange(creep, snapshot.enemyCreeps, RANGED_ATTACK_RANGE);
  if (inRange.length >= 2) {
    creep.rangedMassAttack();
  } else if (inRange.length === 1) {
    // Focus-fire if the squad pick is the lone in-range target; else just
    // shoot what we have.
    const target =
      squad?.focusTarget && inRange.includes(squad.focusTarget)
        ? squad.focusTarget
        : pickTarget(inRange);
    if (target) creep.rangedAttack(target);
  }

  // Threat-driven positioning: if any enemy is within KITE_RANGE - 1, step back.
  const tooClose = snapshot.findInRange(creep, snapshot.enemyCreeps, KITE_RANGE - 1);
  if (tooClose.length > 0) {
    stepAway(creep, snapshot.findClosestByRange(creep, tooClose));
    return;
  }

  const dest = squadMoveTarget(squad, snapshot);
  if (dest) moveToward(creep, dest, snapshot);
}
