// Target prioritization: among candidates, pick the best one for a given attacker.
// Strategy v0: lowest effective HP percentage, with healers preferred at ties.

import { ROLE } from "./body.mjs";
import { classifyRole } from "./body.mjs";

export function pickTarget(candidates) {
  if (!candidates || candidates.length === 0) return null;
  let best = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    const hpPct = c.hits / c.hitsMax;
    const role = c._role || classifyRole(c);
    // Lower is better. Healers get a small bonus so they win ties.
    const score = hpPct - (role === ROLE.HEALER ? 0.1 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

// Squad-level focus target: pick the best enemy in range of ANY squad member.
// All rangers in the squad should shoot this same enemy when they can — focus
// fire kills creeps faster than spreading damage and is the single largest
// micro improvement once positioning is fixed.
//
// Range param defaults to 3 (ranger range). Pass a different value to extend
// the consideration set (e.g. 5 to include enemies one tile from being shot).
export function pickSquadFocusTarget(squadMembers, enemies, snapshot, range = 3) {
  if (!squadMembers || squadMembers.length === 0) return null;
  if (!enemies || enemies.length === 0) return null;
  // Build the candidate set: enemies within `range` of any member.
  const seen = new Set();
  const inRange = [];
  for (const member of squadMembers) {
    for (const e of enemies) {
      if (seen.has(e.id)) continue;
      const r = snapshot.range(member, e);
      if (r <= range) {
        seen.add(e.id);
        inRange.push(e);
      }
    }
  }
  return pickTarget(inRange);
}
