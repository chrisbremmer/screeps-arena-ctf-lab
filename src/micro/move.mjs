// Movement helpers. Centralized so swamp-aware pathing and fatigue checks
// have one place to live as they grow.

import { utils } from "game";

const PATH_OPTS = { plainCost: 2, swampCost: 10 };

// Move toward a target using the game's pathfinder. If a snapshot is passed
// and exposes a costMatrix, the matrix is forwarded so paths prefer road
// tiles (cost 1) over plain (cost 2). Without a costMatrix the pathfinder
// uses terrain costs only and ignores roads.
export function moveToward(creep, target, snapshot) {
  if (!target) return;
  const opts = { ...PATH_OPTS };
  if (snapshot?.costMatrix) opts.costMatrix = snapshot.costMatrix;
  return creep.moveTo(target, opts);
}

// Step directly opposite a threat. Used by ranger kiting.
// Falls back to a no-op if the implied direction is invalid (e.g. zero delta).
export function stepAway(creep, target) {
  const dx = creep.x - target.x;
  const dy = creep.y - target.y;
  if (dx === 0 && dy === 0) return;
  const dir = utils.getDirection(dx, dy);
  return creep.move(dir);
}
