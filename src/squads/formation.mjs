// Group geometry helpers. v0 uses a centroid; future formations slot in here.

// Default cohesion radius. Variants can override via squad.cohesionRadius.
// Note on the value: starting positions span a 7×7 box (initial spread = 7),
// so a radius below 7 traps the squad in cohesion mode at tick 0 and the
// squad never advances. Default of 7 matches the initial formation; cohesion
// engages only when the squad sprawls beyond its starting footprint.
export const DEFAULT_COHESION_RADIUS = 7;

// Pick the move-toward target for a creep in this squad. When cohesion is
// enforced and the squad's spread exceeds the cohesion radius, route the
// creep toward the centroid — stragglers catch up while the front holds
// position. Otherwise the creep proceeds toward the squad's advance target.
//
// Loose-advance mode (squad.looseAdvance + a snapshot): cohesion convergence
// only fires when an enemy is within squad.contactRange of any squad member.
// Out of contact, the squad ignores spread and proceeds straight to the
// advance target — closes the tempo gap during pure-advance phases.
export function squadMoveTarget(squad, snapshot) {
  if (!squad) return null;
  const radius = squad.cohesionRadius ?? DEFAULT_COHESION_RADIUS;
  if (squad.cohesionEnforced && squad.centroid && squad.spread > radius) {
    if (squad.looseAdvance && snapshot && Array.isArray(squad.members)) {
      const range = squad.contactRange ?? 8;
      const enemies = snapshot.enemyCreeps || [];
      const findInRange = snapshot.findInRange;
      const inContact = squad.members.some(
        (m) => (findInRange ? findInRange(m, enemies, range) : []).length > 0,
      );
      if (!inContact) return squad.advanceTarget ?? null;
    }
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
