// Contest-flag play: assign the squad to capture a non-our flag.
// v0 picks the closest capture target by path from the squad centroid.

export function assignContestFlag(squad, snapshot) {
  const candidates = snapshot.captureTargets;
  if (!candidates || candidates.length === 0) {
    squad.advanceTarget = null;
    return;
  }
  const anchor = squad.centroid ?? squad.members[0];
  const target = snapshot.findClosestByPath(anchor, candidates) ?? candidates[0];
  squad.advanceTarget = target;
  squad.objective = { kind: "capture-flag", flag: target };
}
