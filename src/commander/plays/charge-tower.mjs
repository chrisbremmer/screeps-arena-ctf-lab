// Charge-tower play: assign each ferry creep to (container → tower).
// The play returns assignments; the commander dispatches workers to runWorker.
// Returns an empty array if no ferry-capable creeps exist (no CARRY).

import { towerChargePlan } from "../../intel/economy.mjs";

export function planChargeTower(snapshot, ferryCreeps) {
  const plan = towerChargePlan(snapshot);
  if (plan.length === 0 || ferryCreeps.length === 0) return [];

  // v0 round-robin: each ferry takes one tower-charge task. If we have more
  // ferries than towers needing charge, the surplus is unassigned (caller
  // decides what to do — most likely fall through to combat squad).
  const tasks = [];
  for (let i = 0; i < ferryCreeps.length && i < plan.length; i++) {
    tasks.push({ creep: ferryCreeps[i], ...plan[i] });
  }
  return tasks;
}
