// Healer micro: heal the most-damaged squadmate in range, follow squad otherwise.

import { moveToward } from "./move.mjs";
import { HEAL_RANGE, RANGED_HEAL_RANGE } from "../arena/rules.mjs";
import { squadMoveTarget } from "../squads/formation.mjs";

export function runHealer(creep, snapshot, squad) {
  const allies = squad?.members?.filter((c) => c.id !== creep.id) ?? snapshot.myCreeps;
  const damaged = allies
    .filter((c) => c.hits < c.hitsMax)
    .sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax);

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
