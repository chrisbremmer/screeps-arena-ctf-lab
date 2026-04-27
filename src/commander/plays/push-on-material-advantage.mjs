// push-on-material-advantage policy.
//
// Mostly the v3 hold-at-2-flags policy, but with one change: when we hold
// exactly 2 flags AND we have a clear creep-count advantage over the enemy,
// override the hold and contest the next non-our flag. This converts material
// advantage into flag advantage — the failure mode v3 couldn't address (we'd
// stall at 12-vs-5 alive, 2-1-1 flags, never push for the third).
//
// At ≥3 flags we hold (we're already at the tick-out winning flag count;
// pushing for the enemy home is a separate, much riskier proposition).
// At ≤1 flag we contest as v0/v3 do (need to recover or capture a neutral).
//
// Pure — no game-API access. Tested in tests/v4-policy.test.mjs.

import { assignContestFlag } from "./contest-flag.mjs";
import { findCapturedFlag } from "../../intel/flags.mjs";

const DEFAULT_PUSH_THRESHOLD = 4;

export function pushOnMaterialAdvantage(squad, snapshot, options = {}) {
  const threshold = options.threshold ?? DEFAULT_PUSH_THRESHOLD;
  const flagCount = snapshot.myFlags.length;

  // ≥3 flags: hold; we're already tick-out winning.
  if (flagCount >= 3) {
    const captured = findCapturedFlag(snapshot);
    if (captured) {
      squad.advanceTarget = captured;
      squad.objective = { kind: "hold-with-flag-lead", flag: captured };
      return;
    }
  }

  // Exactly 2 flags: hold OR push based on material.
  if (flagCount === 2) {
    const advantage = snapshot.myCreeps.length - snapshot.enemyCreeps.length;
    if (advantage >= threshold) {
      assignContestFlag(squad, snapshot);
      // Tag the objective so the evaluator can attribute outcome to the push decision.
      squad.objective = { kind: "push-with-advantage", advantage };
      return;
    }
    const captured = findCapturedFlag(snapshot);
    if (captured) {
      squad.advanceTarget = captured;
      squad.objective = { kind: "hold-captured-flag", flag: captured };
      return;
    }
  }

  // ≤1 flag: still contesting (recover home or capture first neutral).
  assignContestFlag(squad, snapshot);
}
