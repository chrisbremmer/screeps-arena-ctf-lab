// Economy intel: which towers should we be charging, from which container,
// using which creeps. Pure functions — take a snapshot, return a plan.
//
// In v0 we are deliberately conservative: we only plan to charge towers we own
// (home tower is always ours; neutral towers become ours after we capture the
// linked flag), and we only assign creeps that have CARRY parts. If the snapshot
// has no CARRY-bearing creeps, the plan is empty and the bot does no economy
// work — that's the in-client-verifiable answer to the open CARRY question.

import { PART } from "./body.mjs";

export function towerChargePlan(snapshot) {
  const ferries = snapshot.myCreeps.filter((c) => (c._parts?.[PART.CARRY] ?? 0) > 0);
  if (ferries.length === 0) return [];

  // Only charge towers we own.
  const targets = snapshot.myTowers ?? [];
  if (targets.length === 0) return [];

  const plan = [];
  for (const tower of targets) {
    // Skip if already at capacity — we don't have the typings for store capacity in
    // every prototype version, but most towers expose `store.energy` / `store.getFreeCapacity`.
    if (tower.store && tower.store.getFreeCapacity && tower.store.getFreeCapacity("energy") === 0) continue;

    const container = nearestContainerWithEnergy(tower, snapshot);
    if (!container) continue;

    plan.push({ tower, container });
  }
  return plan;
}

function nearestContainerWithEnergy(tower, snapshot) {
  const stocked = (snapshot.containers ?? []).filter(
    (c) => c.store && (c.store.energy ?? c.store["energy"] ?? 0) > 0,
  );
  if (stocked.length === 0) return null;
  return snapshot.findClosestByPath(tower, stocked);
}
