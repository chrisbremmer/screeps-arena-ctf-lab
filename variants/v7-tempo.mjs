// v7-tempo
//
// v6 batch: 5W-5L, +3 net rating. WarNeverChanges v10 1581t loss replay
// shows the failure mode in the tick log: by tick 100 enemy holds 2 flags
// and we hold 1, with both squads still 14 alive. We lost the opening race
// for the close neutral. A selected ranger at tick 112 had moved ~29 tiles
// in 111 ticks — ~26% of theoretical max move speed.
//
// Two changes from v6, both targeting movement tempo. Tradeoff acknowledged:
// if v7 wins, an ablation variant turns each piece off to attribute lift.
//
//   A. Road-aware pathing. Snapshot now carries a CostMatrix built once per
//      match with road tiles set to cost 1. Default findPath uses terrain
//      data only and ignores StructureRoad — confirmed in the docs. If the
//      map's diagonal is road, paths along it are now ~2× faster.
//
//   B. Loose cohesion when out of contact. Cohesion convergence (route to
//      centroid when spread > radius) only fires if an enemy is within
//      range 8 of any squad member. During pure advance the squad ignores
//      spread and proceeds straight to the advance target — directly counter
//      to the spread-stuck-at-7 stall observed across every v6 tick log.
//
// Hypothesis: the v10 tempo gap is caused by terrain-blind pathing (no road
// awareness) and always-on convergence. Win condition for v7: by tick 100
// in ≥50% of matches, hold ≥1 flag advantage over the opponent.
//
// Everything else identical to v6.

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
    looseAdvance: true,
    contactRange: 8,
  });
}
