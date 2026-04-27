// Classification and effective-stat math for creep bodies.
// Pure functions — no side effects, no game-API calls. Easy to unit test.
//
// Body part type strings match the values exported by `game/constants` exactly.
// We use the literals here rather than importing from "game" so this module is
// runnable under plain Node for tests.

export const PART = Object.freeze({
  ATTACK: "attack",
  CARRY: "carry",
  HEAL: "heal",
  MOVE: "move",
  RANGED_ATTACK: "ranged_attack",
  TOUGH: "tough",
  WORK: "work",
});

export const ROLE = Object.freeze({
  HEALER: "healer",
  RANGER: "ranger",
  MELEE: "melee",
  WORKER: "worker",
  UNKNOWN: "unknown",
});

export function classifyRole(creep) {
  const counts = countParts(creep);
  if (counts[PART.HEAL] > 0) return ROLE.HEALER;
  if (counts[PART.RANGED_ATTACK] > 0) return ROLE.RANGER;
  if (counts[PART.ATTACK] > 0) return ROLE.MELEE;
  if (counts[PART.WORK] > 0 || counts[PART.CARRY] > 0) return ROLE.WORKER;
  return ROLE.UNKNOWN;
}

export function countParts(creep) {
  const counts = {
    [PART.ATTACK]: 0,
    [PART.RANGED_ATTACK]: 0,
    [PART.HEAL]: 0,
    [PART.MOVE]: 0,
    [PART.CARRY]: 0,
    [PART.WORK]: 0,
    [PART.TOUGH]: 0,
  };
  for (const part of creep.body) counts[part.type] = (counts[part.type] || 0) + 1;
  return counts;
}

// Will the creep be able to move at full speed on plain terrain given its current body?
// Used for body-growth decisions. Plain terrain costs 2 fatigue per non-MOVE part per move.
export function isMoveBalancedOnPlain(creep) {
  const counts = countParts(creep);
  const nonMove = creep.body.length - counts[PART.MOVE];
  return counts[PART.MOVE] >= nonMove;
}
