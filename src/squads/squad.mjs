// A squad is a group of creeps with a shared advance target. The squad
// dispatches each member to its role-specific micro.

import { ROLE } from "../intel/body.mjs";
import { runRanger } from "../micro/ranger.mjs";
import { runHealer } from "../micro/healer.mjs";
import { runMelee } from "../micro/melee.mjs";
import { centroid, maxSpread } from "./formation.mjs";

export function makeSquad(name, members, advanceTarget) {
  return { name, members, advanceTarget };
}

export function runSquad(squad, snapshot) {
  squad.centroid = centroid(squad.members);
  squad.spread = maxSpread(squad.members);

  for (const creep of squad.members) {
    const role = creep._role;
    if (role === ROLE.RANGER) runRanger(creep, snapshot, squad);
    else if (role === ROLE.HEALER) runHealer(creep, snapshot, squad);
    else if (role === ROLE.MELEE) runMelee(creep, snapshot, squad);
    // Unknown roles are no-ops in v0. We'll log them so we notice.
  }
}
