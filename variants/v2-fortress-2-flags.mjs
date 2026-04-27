// v2-fortress-2-flags
//
// Hypothesis: at the matchmaker tier we're actually facing, the natural
// equilibrium is 2-2 flags by tick 100. From that position, pushing past 2
// flags is a 5-vs-13 trade we lose. The optimal play is to bank the 2-flag
// draw floor with a fortress-style defense, then only push when growth has
// tipped the math.
//
// Three changes from v0, all in service of the same strategy:
//
//   1. Cohesion-enforced movement. Squad members don't walk alone — when
//      spread > COHESION_RADIUS, stragglers route to the centroid and the
//      front waits. Fixes the tick-100→200 die-off seen in every v0/v1 match.
//
//   2. Active tower operation. Every charged my-tower fires on the nearest
//      enemy creep in range. Works whether towers auto-fire or not. With
//      ~1000 dmg per shot at range 1, a charged home tower turns our base
//      into a kill zone.
//
//   3. Hold-at-2-flags policy (return of v1, but compatible with cohesion).
//      Once we own ≥2 flags, anchor the squad on the captured non-home flag
//      inside its tower's coverage. Don't push for the third flag.
//
// Strategy notes in docs/PLAYBOOK.md.

import { tick } from "../src/commander/commander.mjs";
import { holdAtTwoFlags } from "../src/commander/plays/hold-at-two-flags.mjs";

export function loop() {
  tick({
    mainPlay: holdAtTwoFlags,
    cohesionEnforced: true,
    operateTowers: true,
  });
}
