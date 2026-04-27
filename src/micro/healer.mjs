// Healer micro: heal the most-damaged squadmate in range, follow squad otherwise.
//
// Triage: creeps that are actively in combat (enemy within range 5) get a
// score bonus so they're prioritized over equally-damaged creeps standing
// safely. This addresses the v5 failure mode where damage spread evenly
// across the squad and combat creeps died before healers could focus on them.

import { moveToward } from "./move.mjs";
import { HEAL_RANGE, RANGED_HEAL_RANGE } from "../arena/rules.mjs";
import { squadMoveTarget } from "../squads/formation.mjs";

const COMBAT_PROXIMITY = 5;
const COMBAT_PRIORITY_BONUS = 0.2;

function isInCombat(creep, snapshot) {
  return snapshot.findInRange(creep, snapshot.enemyCreeps, COMBAT_PROXIMITY).length > 0;
}

function triageScore(creep, snapshot) {
  // Lower score = higher priority. HP percentage minus a combat bonus.
  const hpPct = creep.hits / creep.hitsMax;
  return hpPct - (isInCombat(creep, snapshot) ? COMBAT_PRIORITY_BONUS : 0);
}

export function runHealer(creep, snapshot, squad) {
  const allies = squad?.members?.filter((c) => c.id !== creep.id) ?? snapshot.myCreeps;
  const damaged = allies
    .filter((c) => c.hits < c.hitsMax)
    .sort((a, b) => triageScore(a, snapshot) - triageScore(b, snapshot));

  // Self-heal is fine if nothing else needs it more.
  if (creep.hits < creep.hitsMax && (damaged.length === 0 || creep.hits / creep.hitsMax < 0.5)) {
    creep.heal(creep);
  }

  if (damaged.length > 0) {
    const target = damaged[0];
    const range = snapshot.range(creep, target);
    if (range <= HEAL_RANGE) {
      creep.heal(target);
    } else if (range <= RANGED_HEAL_RANGE) {
      creep.rangedHeal(target);
      moveToward(creep, target);
    } else {
      moveToward(creep, target);
    }
    return;
  }

  const dest = squadMoveTarget(squad);
  if (dest) moveToward(creep, dest);
}
