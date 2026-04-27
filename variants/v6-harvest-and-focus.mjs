// v6-harvest-and-focus
//
// v5 batch: 4W-4L-2D, +5 net rating. The bimodal failure-mode is mostly
// resolved (9 of 10 matches now reach the late game vs 5/10 before).
// Wins are tick-out flag-count wins at 2-1-1; draws at 2-2; losses are
// when enemy concentrates 11+ creeps on home and our defense isn't
// strong enough to hold even with rush-defense recall.
//
// Three changes from v5, intentionally bundled. Tradeoff acknowledged:
// if v6 wins, an ablation variant turns each piece off to attribute lift.
//
//   A. River body-part harvesting. When stable (≥2 flags, no rush, ≥8
//      spare combat creeps, body parts present), peel off 1 ranger + 1
//      healer to harvest body parts. Per Winsley's match analysis this
//      was the single biggest unlock between 1600 and 1800 ELO.
//      Priority: MOVE > RANGED_ATTACK > HEAL > ATTACK > others.
//
//   B1. Squad-level focus fire. Squad picks ONE focus target per tick;
//       all rangers in range shoot it. Out-of-range rangers fall back
//       to local pick. Removes creeps faster than spreading damage,
//       which is the standard counter to the "11 enemies on home" loss
//       pattern.
//
//   B2. Healer combat-priority triage. Healers prefer healing creeps
//       that are within 5 tiles of an enemy (active combat) over
//       equally-damaged creeps standing safely. Addresses the v5 issue
//       where damage was spread evenly and engaged creeps died first.
//
// Everything else identical to v5.

import { tick } from "../src/commander/commander.mjs";
import { defendOrPush } from "../src/commander/plays/defend-or-push.mjs";

const PUSH_THRESHOLD = 4;
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
  });
}
