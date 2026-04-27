// v4-push-with-advantage
//
// v3 batch (10 ranked matches): 2W-7L-1D, rating 334 → 297. The cohesion
// fix worked mechanically — we reach 12-vs-5-or-better alive at 2-1-1 flags
// in nearly every match by tick 200. But hold-at-2-flags caps us at 2 forever,
// and we never convert mid-game material dominance into a winning flag count.
// Both v3 wins were tick-out 2-1-1 flag-count wins, not actual third-flag
// captures. Long matches eroded as the enemy outgrew us via the river.
//
// v4 fix: when we hold exactly 2 flags AND our creep count exceeds the enemy's
// by ≥4, push for the third flag. Drops back to hold the moment material
// advantage closes. Everything else (cohesion, tower commands, charging)
// identical to v3.
//
// What we expect to see:
//   - In matches where v3 stalled at 2-1-1 with material dominance, we now
//     advance to capture the third flag → outright wins instead of tick-out
//     timeouts.
//   - In matches where the engagement is even, we behave the same as v3
//     (advantage < 4 → hold).
//   - In matches where we're behind, we behave the same as v3 (still contest).

import { tick } from "../src/commander/commander.mjs";
import { pushOnMaterialAdvantage } from "../src/commander/plays/push-on-material-advantage.mjs";

const PUSH_THRESHOLD = 4;

function policy(squad, snapshot) {
  return pushOnMaterialAdvantage(squad, snapshot, { threshold: PUSH_THRESHOLD });
}

export function loop() {
  tick({
    mainPlay: policy,
    cohesionEnforced: true,
    cohesionRadius: 7,
    operateTowers: true,
  });
}
