// A squad is a group of creeps with a shared advance target. The squad
// dispatches each member to its role-specific micro.
//
// Workers are special — when the commander has assigned them a ferry task,
// they run runWorker with that task instead of squad-relative micro.

import { ROLE } from "../intel/body.mjs";
import { pickSquadFocusTarget } from "../intel/target.mjs";
import { runRanger } from "../micro/ranger.mjs";
import { runHealer } from "../micro/healer.mjs";
import { runMelee } from "../micro/melee.mjs";
import { runWorker } from "../micro/worker.mjs";
import { centroid, maxSpread } from "./formation.mjs";

export function makeSquad(name, members, advanceTarget) {
  return { name, members, advanceTarget, ferryTasks: new Map() };
}

// Assign a ferry task to a specific creep within a squad. Called by the commander
// before runSquad so the worker micro picks it up on the same tick.
export function assignFerryTask(squad, creep, task) {
  squad.ferryTasks.set(creep.id, task);
}

export function runSquad(squad, snapshot) {
  squad.centroid = centroid(squad.members);
  squad.spread = maxSpread(squad.members);
  // Pre-compute one focus target the whole squad will prioritize this tick.
  // Rangers/melee can fall back to local picks if focus isn't in their range.
  squad.focusTarget = pickSquadFocusTarget(squad.members, snapshot.enemyCreeps, snapshot, 3);

  for (const creep of squad.members) {
    const ferry = squad.ferryTasks.get(creep.id);
    if (ferry) {
      runWorker(creep, snapshot, ferry);
      continue;
    }
    const role = creep._role;
    if (role === ROLE.RANGER) runRanger(creep, snapshot, squad);
    else if (role === ROLE.HEALER) runHealer(creep, snapshot, squad);
    else if (role === ROLE.MELEE) runMelee(creep, snapshot, squad);
    // Workers without a ferry task fall through to the squad's combat advance.
    else if (role === ROLE.WORKER && squad.advanceTarget) runMelee(creep, snapshot, squad);
    // Unknown roles are no-ops in v0.
  }
}
