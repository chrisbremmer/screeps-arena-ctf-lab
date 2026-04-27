// v1-hold-at-two-flags
//
// Hypothesis: stop after capturing the close neutral; anchor the squad on it;
// don't push for the second neutral.
//
// Evidence (journal/2026-04-27.md placement matches): v0 loses 9 of 14 creeps
// in 50 ticks (tick 150 → 200) every time it pushes for the second neutral
// flag, regardless of opponent. Both placement losses came after the squad
// got reduced to 5/14. Holding at 2 flags banks the tick-out tie-break floor
// (more flags wins) and avoids the over-extension trade.
//
// Diff vs v0-baseline: when we own ≥2 flags, the main squad anchors on the
// captured non-home flag instead of contesting another flag. Everything else
// (worker ferry, sentry healer, micro) is identical.

import { tick } from "../src/commander/commander.mjs";
import { holdAtTwoFlags } from "../src/commander/plays/hold-at-two-flags.mjs";

export function loop() {
  tick({ mainPlay: holdAtTwoFlags });
}
