// Group geometry helpers. v0 uses a centroid; future formations slot in here.
//
// COHESION_RADIUS is duplicated here rather than imported from arena/rules.mjs
// so this module stays pure (rules.mjs imports the runtime `game` package).

const COHESION_RADIUS = 3;

// Pick the move-toward target for a creep in this squad. When cohesion is
// enforced and the squad's spread exceeds COHESION_RADIUS, route the creep
// toward the centroid — the front waits naturally (centroid is behind them
// in the direction of travel) and stragglers catch up. Otherwise the creep
// proceeds toward the squad's advance target.
export function squadMoveTarget(squad) {
  if (!squad) return null;
  if (squad.cohesionEnforced && squad.centroid && squad.spread > COHESION_RADIUS) {
    return squad.centroid;
  }
  return squad.advanceTarget ?? null;
}

export function centroid(creeps) {
  if (!creeps || creeps.length === 0) return null;
  let sx = 0;
  let sy = 0;
  for (const c of creeps) {
    sx += c.x;
    sy += c.y;
  }
  return { x: Math.round(sx / creeps.length), y: Math.round(sy / creeps.length) };
}

export function maxSpread(creeps) {
  if (!creeps || creeps.length < 2) return 0;
  let max = 0;
  for (let i = 0; i < creeps.length; i++) {
    for (let j = i + 1; j < creeps.length; j++) {
      const dx = creeps[i].x - creeps[j].x;
      const dy = creeps[i].y - creeps[j].y;
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      if (d > max) max = d;
    }
  }
  return max;
}
