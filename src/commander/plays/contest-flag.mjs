// Contest-flag play: assign the squad to capture a non-our flag.
// Picks the closest capture target by path from the squad centroid.
//
// Tower-zone filter: candidates inside enemy tower range (default 20) are
// dropped from consideration unless no safer option exists. The enemy home
// flag sits at range 1 of their tower — pushing for it without overwhelming
// force is nearly suicidal. Falling back to all candidates only when the
// safe set is empty preserves behaviour for matches where every flag is
// somehow tower-covered.

import { flagInsideTowerRange } from "../../intel/flags.mjs";

export function assignContestFlag(squad, snapshot) {
  const all = snapshot.captureTargets;
  if (!all || all.length === 0) {
    squad.advanceTarget = null;
    return;
  }
  const safe = all.filter(
    (f) => !flagInsideTowerRange(f, snapshot.enemyTowers, snapshot, 20),
  );
  const candidates = safe.length > 0 ? safe : all;
  const anchor = squad.centroid ?? squad.members[0];
  const target = snapshot.findClosestByPath(anchor, candidates) ?? candidates[0];
  squad.advanceTarget = target;
  squad.objective = { kind: "capture-flag", flag: target };
}
