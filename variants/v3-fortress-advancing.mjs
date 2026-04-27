// v3-fortress-advancing
//
// v2 was directionally right (2W-6L-2D, +draws-vs-passive-bots, +tower-fire-
// dominates-aggressors) but had a load-bearing bug: COHESION_RADIUS was 3
// while the starting squad spans a 7-tile box. The squad entered cohesion
// mode at tick 0 and never exited, plateauing at spread 4–5 forever. We
// only won/drew matches where the enemy walked into our towers; against
// passive enemies we held a 1-1-2 stalemate; against aggressive enemies who
// captured both neutrals while we sat, we tick-out lost at 1-3.
//
// v3 fix: bump cohesion radius to 7 so initial formation passes the check.
// The squad advances normally; cohesion engages only when spread genuinely
// blows up (the 49-spread sprawl that killed v0/v1).
//
// Everything else identical to v2: hold-at-2-flags, active tower operation.

import { tick } from "../src/commander/commander.mjs";
import { holdAtTwoFlags } from "../src/commander/plays/hold-at-two-flags.mjs";

export function loop() {
  tick({
    mainPlay: holdAtTwoFlags,
    cohesionEnforced: true,
    cohesionRadius: 7,
    operateTowers: true,
  });
}
