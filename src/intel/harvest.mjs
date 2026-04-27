// Harvester logic: pick which body part to walk toward.
//
// Per Winsley's 1600→1800 climb, MOVE parts are highest strategic value
// (mobility = tempo, can't be substituted). Then RANGED_ATTACK for DPS.
// Then HEAL for sustain. Then ATTACK (melee-only, lower utility for
// kiting rangers). TOUGH last (we don't pick those up if avoidable).
//
// Pure — no game-API access. Easy to test.

import { PART } from "./body.mjs";

const PART_PRIORITY = Object.freeze({
  [PART.MOVE]: 5,
  [PART.RANGED_ATTACK]: 4,
  [PART.HEAL]: 3,
  [PART.ATTACK]: 2,
  [PART.TOUGH]: 1,
  [PART.CARRY]: 1,
  [PART.WORK]: 1,
});

// Pick the best body part for this harvester to walk toward. Score balances
// part priority against distance — close-and-medium-priority beats far-and-
// high-priority for tempo reasons.
export function pickHarvestTarget(harvester, bodyParts) {
  if (!harvester || !bodyParts || bodyParts.length === 0) return null;

  let best = null;
  let bestScore = -Infinity;
  for (const part of bodyParts) {
    const priority = PART_PRIORITY[part.type] ?? 0;
    const dx = part.x - harvester.x;
    const dy = part.y - harvester.y;
    const dist = Math.max(Math.abs(dx), Math.abs(dy));
    // Score: priority dominates; distance is a tiebreaker. A 5-priority
    // part beats a 4-priority part within ~10 tiles' difference.
    const score = priority * 10 - dist;
    if (score > bestScore) {
      bestScore = score;
      best = part;
    }
  }
  return best;
}

// Should we activate the harvester squad this tick? Only when conditions are
// favourable: we have flag floor (≥2), no rush is happening, we have spare
// combat creeps, and there are body parts to grab.
export function shouldHarvest(snapshot, options = {}) {
  const minFlagFloor = options.minFlagFloor ?? 2;
  const minSpareCreeps = options.minSpareCreeps ?? 8;
  if ((snapshot.myFlags?.length ?? 0) < minFlagFloor) return false;
  if ((snapshot.bodyParts?.length ?? 0) === 0) return false;
  if ((snapshot.myCreeps?.length ?? 0) < minSpareCreeps) return false;
  return true;
}
