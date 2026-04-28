// Movement helpers. Centralized so swamp-aware pathing and fatigue checks
// have one place to live as they grow.

import { utils } from "game";

const PATH_OPTS = { plainCost: 2, swampCost: 10 };

export function moveToward(creep, target, opts = {}) {
  if (!target) return;
  return creep.moveTo(target, { ...PATH_OPTS, ...opts });
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
