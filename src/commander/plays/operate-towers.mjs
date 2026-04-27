// operate-towers: every charged my-tower fires on the nearest enemy creep in
// its range. Belt-and-suspenders: works whether towers auto-fire when charged
// or require explicit intents. Even if they auto-fire, explicit commands let
// us prioritize targets in future iterations.
//
// Tower constants are duplicated locally rather than imported from
// arena/rules.mjs (which transitively imports the runtime `game` package).
// Keeping this module pure means pickTowerTarget is unit-testable in Node.

const TOWER_RANGE = 20;
const TOWER_ENERGY_COST = 10;
const RESOURCE_ENERGY = "energy";

export function operateAllTowers(snapshot) {
  if (!snapshot.myTowers || snapshot.myTowers.length === 0) return;
  for (const tower of snapshot.myTowers) {
    const energy = readEnergy(tower);
    if (energy < TOWER_ENERGY_COST) continue;

    const inRange = snapshot.findInRange(tower, snapshot.enemyCreeps, TOWER_RANGE);
    if (inRange.length === 0) continue;

    const target = pickTowerTarget(tower, inRange, snapshot);
    if (target && typeof tower.attack === "function") {
      tower.attack(target);
    }
  }
}

function readEnergy(tower) {
  if (!tower.store) return 0;
  return tower.store.energy ?? tower.store[RESOURCE_ENERGY] ?? 0;
}

// Target priority: lowest-HP enemy in range. Damage compounds toward removing
// creeps from the board; spreading damage is wasted. Tie-break by closest
// (more reliable damage at lower range).
export function pickTowerTarget(tower, candidates, snapshot) {
  if (!candidates || candidates.length === 0) return null;
  let best = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    const hpPct = c.hits / c.hitsMax;
    const range = snapshot.range(tower, c);
    const score = hpPct * 100 + range;
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}
