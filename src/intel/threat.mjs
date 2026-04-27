// Threat scoring for enemy creeps. Higher score = more dangerous.
// Used by target selection. Pure — runnable in Node for tests.

import { countParts, PART } from "./body.mjs";

export function threatScore(creep) {
  const c = countParts(creep);
  // Coarse first pass: weighted sum of role parts. Refine when data tells us this is wrong.
  return c[PART.RANGED_ATTACK] * 10 + c[PART.ATTACK] * 8 + c[PART.HEAL] * 6;
}
