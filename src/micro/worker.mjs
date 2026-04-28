// Worker micro: ferry energy from a container to a tower. Used by the
// charge-tower play. Workers are simply creeps that have CARRY parts — role
// classification is by body, so a creep with CARRY + ATTACK is still a worker
// for these purposes when assigned to ferry duty.

import { moveToward } from "./move.mjs";

const RESOURCE_ENERGY = "energy";

// task: { tower, container }
export function runWorker(creep, snapshot, task) {
  if (!task) return;
  const { tower, container } = task;
  const carrying = creep.store && (creep.store.energy ?? creep.store[RESOURCE_ENERGY] ?? 0) > 0;

  if (!carrying) {
    // Withdraw from container.
    if (snapshot.range(creep, container) > 1) {
      moveToward(creep, container);
    } else {
      creep.withdraw(container, RESOURCE_ENERGY);
    }
    return;
  }

  // Transfer to tower.
  if (snapshot.range(creep, tower) > 1) {
    moveToward(creep, tower);
  } else {
    creep.transfer(tower, RESOURCE_ENERGY);
  }
}
