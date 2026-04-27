// hold-at-two-flags policy.
//
// When we own ≥2 flags, anchor the squad on the captured non-home flag.
// When we own <2, defer to the contest-flag play.
//
// Pure — no game-API access. Tested in tests/v1-policy.test.mjs.

import { assignContestFlag } from "./contest-flag.mjs";
import { findCapturedFlag } from "../../intel/flags.mjs";

export function holdAtTwoFlags(squad, snapshot) {
  if (snapshot.myFlags.length >= 2) {
    const captured = findCapturedFlag(snapshot);
    if (captured) {
      squad.advanceTarget = captured;
      squad.objective = { kind: "hold-captured-flag", flag: captured };
      return;
    }
  }
  assignContestFlag(squad, snapshot);
}
