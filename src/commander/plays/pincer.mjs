// Pincer play: a small splinter squad takes the off-side neutral while the
// main squad takes the close one. Both neutrals are equidistant from both
// homes — main and enemy each pick one (whichever findClosestByPath returns
// first), and pincer targets the OTHER. Result: we capture both side flags
// while enemy commits to one, securing 3 flags by mid-game.
//
// Inputs:
//   squad — the pincer squad (1 ranger + 1 healer, ideally).
//   snapshot — current world snapshot.
//   mainTarget — the flag main is heading for (so pincer doesn't duplicate).
//
// If mainTarget is null/undefined, pincer picks any non-tower-zone capture
// target. If only one candidate exists, both squads will overlap — harmless.

import { flagInsideTowerRange } from "../../intel/flags.mjs";

export function assignPincer(squad, snapshot, mainTarget) {
  if (!squad || !squad.members || squad.members.length === 0) return;

  const allCandidates = (snapshot.captureTargets || []).filter(
    (f) => !flagInsideTowerRange(f, snapshot.enemyTowers, snapshot, 20),
  );

  if (allCandidates.length === 0) {
    // Nowhere safe to go — fall back to defending nearest my-flag.
    const home = snapshot.myFlags?.[0] ?? null;
    squad.advanceTarget = home;
    squad.objective = { kind: "pincer-fallback" };
    return;
  }

  // Prefer the candidate that ISN'T main's target.
  let pick = allCandidates.find((f) => f !== mainTarget);
  if (!pick) pick = allCandidates[0];

  squad.advanceTarget = pick;
  squad.objective = { kind: "pincer-capture", flag: pick };
}
