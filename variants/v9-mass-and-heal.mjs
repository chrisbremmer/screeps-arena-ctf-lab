// v9-mass-and-heal
//
// v8 batch: 0W-9L-1?, rating 305 → 240 (−65). Catastrophic. Strategic
// changes (pincer squad + PUSH_THRESHOLD=Infinity) caused the bleed.
// Reverted active variant to v6 to stop bleeding.
//
// v9 ships ONLY arithmetic upgrades — changes that strictly dominate the
// alternative or are no-ops, never strictly worse. Per the deep-research
// synthesis (cite: jonwinsley.com/notes/screeps-arena-pressing-attack and
// LittleSound's screeps-arena/develop/src/arena_capture_the_flag/main.ts):
//
//   1. Ranger rangedMassAttack when ≥2 enemies in range 3. Same per-target
//      damage as rangedAttack at every range tier, but hits all enemies in
//      range. Mathematically zero downside; doubles damage at n=2, triples
//      at n=3. (Already in src/micro/ranger.mjs from v8 — kept on disk
//      because it's a strict upgrade, gated by the n≥2 condition.)
//
//   2. Tower heal-when-idle. When a charged tower has no enemy in range,
//      heal the most-damaged my-creep in range instead of wasting the
//      cooldown. Heal power 600 at r=1, -30/tile falloff. Tower attack and
//      heal share the same cooldown/energy slot, so this is strictly free.
//
// Everything else is identical to v6: cohesion radius 7, push at +4
// material advantage, rush-defense recall, harvester squad, focus fire,
// healer combat-priority. No structural changes. No new squads.
//
// Hypothesis: v6 baseline + arithmetic upgrades = small but consistently
// positive ELO movement. If v9 doesn't beat v6, the arithmetic upgrades are
// no-ops on this map — but they cannot be losses by introduction.

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
  });
}
