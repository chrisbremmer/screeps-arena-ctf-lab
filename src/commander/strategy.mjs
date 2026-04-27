// Strategy detection. v0 always picks "rush". Phase 3 will branch on enemy composition.

import { ROLE } from "../intel/body.mjs";

export const STRATEGY = {
  RUSH: "rush",
  RIVER_CONTROL: "river_control",
  DEFEND: "defend",
};

export function pickStrategy(/* snapshot */) {
  return STRATEGY.RUSH;
}

// Read enemy composition. Useful for telemetry now even before we branch on it.
export function readEnemyComp(snapshot) {
  const counts = { [ROLE.RANGER]: 0, [ROLE.HEALER]: 0, [ROLE.MELEE]: 0, other: 0 };
  for (const c of snapshot.enemyCreeps) {
    if (counts[c._role] !== undefined) counts[c._role]++;
    else counts.other++;
  }
  return counts;
}
