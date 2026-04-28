// v8-omnibus
//
// v7-tempo batch: 4W-4L-2D, rating 307 → 305 (−2). Hypothesis falsified
// (tempo unchanged at tick 100), and loose-cohesion introduced the
// concertina bug (spread:37 → leading creeps retreat to centroid → mass
// death).
//
// v8 reverts loose-cohesion and bundles every queued tactical improvement
// into one variant. User explicitly named the tradeoff (signal isolation
// for win-rate) and approved an aggressive bundle. If v8 wins, ablation
// variants attribute the lift.
//
// Changes from v7:
//
//   1. Drop looseAdvance (revert the concertina bug). Cohesion behaves as
//      v6: radius 7, always-on convergence on sprawl.
//
//   2. Pincer squad. 1 ranger + 1 healer detach at match start to capture
//      the off-side neutral (the one main isn't going for). Targets a
//      consistent 3-flag end-state without depending on a push.
//
//   3. Disable the push-from-main (PUSH_THRESHOLD = Infinity). Main holds
//      at 2 flags and lets pincer bring the third. Eliminates the
//      push-then-recapture cycle that defined v5/v6 long losses.
//
//   4. rangedMassAttack when ≥2 enemies in range (ranger.mjs). Per the
//      docs, mass-attack damage equals single-target rangedAttack at the
//      same range tier — but hits ALL enemies in range. Free DPS multiplier
//      in cohesion fights, exactly the situation that loses us tick 200.
//
//   5. Heavy healer-priority weighting in target selection (-0.6 HP-pct
//      bonus, was -0.1). Killing a healer denies ~6 healer-ticks of healing
//      per kill — best per-kill value on the board.
//
//   6. Tower-zone awareness in contest-flag. Drops candidates inside enemy
//      tower range (default 20) when a safer alternative exists. Only pushes
//      for an under-tower flag as a last resort.
//
//   7. Cost matrix records and exposes a road count. Logged in init event
//      as `roadCount` so we can confirm whether the CTF map has road tiles
//      at all (v7's tempo hypothesis depended on this).
//
// Hypothesis: v6's foundation + pincer + mass-attack + healer-priority +
// tower-zone awareness will lift win rate against v10-class opponents and
// generate consistent 3-flag end-states.

import { tick } from "../src/commander/commander.mjs";
import { defendOrPush } from "../src/commander/plays/defend-or-push.mjs";

const PUSH_THRESHOLD = Infinity; // Main never pushes; pincer takes the third flag.
const RUSH_THRESHOLD = 4;
const RUSH_RANGE = 25;

function policy(squad, snapshot) {
  return defendOrPush(squad, snapshot, {
    threshold: PUSH_THRESHOLD,
    rushThreshold: RUSH_THRESHOLD,
    rushRange: RUSH_RANGE,
  });
}

export function loop() {
  tick({
    mainPlay: policy,
    cohesionEnforced: true,
    cohesionRadius: 7,
    operateTowers: true,
    harvestRiver: true,
    harvesterCount: 2,
    pincer: true,
  });
}
