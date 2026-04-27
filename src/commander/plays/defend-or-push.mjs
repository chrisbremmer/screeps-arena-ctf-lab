// defend-or-push policy.
//
// Wraps push-on-material-advantage with a rush-detection guard. When a
// significant number of enemy creeps cluster near any flag we own, recall
// the squad to defend that flag — overriding both push and hold logic.
//
// Pattern adapted from LittleSound/screeps-arena's Defense state. Addresses
// the v4 short-loss failure mode: matches that ended <600 ticks where the
// enemy reached a flag we held faster than we could defend it.
//
// Defense priority on tie: home flag is weighted higher because losing
// home is unrecoverable — losing a captured neutral just drops us to 1
// flag, which we can sometimes recover from.
//
// Pure — no game-API access. Tested in tests/v5-policy.test.mjs.

import { findHomeFlag } from "../../intel/flags.mjs";
import { pushOnMaterialAdvantage } from "./push-on-material-advantage.mjs";

const DEFAULT_RUSH_RANGE = 25;
const DEFAULT_RUSH_THRESHOLD = 4;

// Returns the most-threatened flag we own, or null if no rush is detected.
// Range and threshold are tunable per variant.
export function detectRushedFlag(snapshot, options = {}) {
  const range = options.rushRange ?? DEFAULT_RUSH_RANGE;
  const threshold = options.rushThreshold ?? DEFAULT_RUSH_THRESHOLD;
  if (!snapshot.myFlags || snapshot.myFlags.length === 0) return null;

  const home = findHomeFlag(snapshot);
  let best = null;
  let bestEffective = -1;

  for (const flag of snapshot.myFlags) {
    const enemiesNear = snapshot.findInRange(flag, snapshot.enemyCreeps, range) || [];
    // Home gets a +1 effective bias so it wins ties; losing it = game over.
    const isHome = home && flag === home;
    const effective = enemiesNear.length + (isHome ? 1 : 0);
    if (enemiesNear.length >= threshold && effective > bestEffective) {
      bestEffective = effective;
      best = flag;
    }
  }
  return best;
}

export function defendOrPush(squad, snapshot, options = {}) {
  const threatened = detectRushedFlag(snapshot, options);
  if (threatened) {
    squad.advanceTarget = threatened;
    squad.objective = { kind: "rush-defense", flag: threatened };
    return;
  }
  // No rush — delegate to the underlying push/hold policy.
  pushOnMaterialAdvantage(squad, snapshot, options);
}
