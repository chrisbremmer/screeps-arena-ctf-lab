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
