// v5-rush-defense
//
// v4 batch: 4W-5L-1D, +2 net rating. Bimodal outcome: every match that
// reached tick 2000 we won or drew (5/5); every match that ended <600 ticks
// we lost (0W-5L). Short losses cost ~7 rating each — they're the dominant
// failure mode.
//
// Research pass (Winsley 2022 + LittleSound's bot) surfaced one pattern we
// don't have: a defensive recall trigger when the enemy is rushing a flag
// we own. LittleSound: "if enemyCreeps within 51 of myFlag and tick < 1500,
// fall back."
//
// v5 fix: defend-or-push policy. Each tick, if ≥4 enemies cluster within
// range 25 of any my-flag, override the push/hold logic and recall the
// squad to defend that flag. Home flag is weighted higher to break ties.
// Otherwise fall through to v4's pushOnMaterialAdvantage.
//
// Bonus: v5 adds diagnostic telemetry (per-tower energy, per-flag enemy
// proximity, squad objective at each log) so v6 has data on whether tower
// charging is actually keeping up and which scenarios trigger which plays.
//
// Other research findings, recorded for context but not changing the bot
// in v5:
//   - Towers do NOT auto-fire (we already commanded them — confirmed correct).
//   - TOWER_CAPACITY = 10, one shot per fill (continuous charging needed).
//   - Tower ownership transfers on flag capture (myTowers picks them up).
//   - Body parts function immediately on pickup (no zero-hits gotcha).
//   - 1600+ rating breakthrough is river body-part harvesting; not yet
//     relevant at our 299.

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
  });
}
