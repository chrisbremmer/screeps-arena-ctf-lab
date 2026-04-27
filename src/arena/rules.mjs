// CTF-specific helpers and constants. Anything that's "true because this is the CTF arena"
// (rather than "true because this is Screeps") lives here.

import { prototypes, utils } from "game";

export const COHESION_RADIUS = 3;
export const KITE_RANGE = 3;
export const HEAL_RANGE = 1;
export const RANGED_HEAL_RANGE = 3;
export const RANGED_ATTACK_RANGE = 3;
export const MELEE_RANGE = 1;

export function getMyFlag() {
  return utils.getObjectsByPrototype(prototypes.Flag).find((f) => f.my === true) || null;
}

export function getEnemyFlag() {
  return utils.getObjectsByPrototype(prototypes.Flag).find((f) => f.my === false) || null;
}

export function getMyCreeps() {
  return utils.getObjectsByPrototype(prototypes.Creep).filter((c) => c.my && !c.spawning);
}

export function getEnemyCreeps() {
  return utils.getObjectsByPrototype(prototypes.Creep).filter((c) => !c.my);
}

export function getMyTowers() {
  return utils.getObjectsByPrototype(prototypes.StructureTower).filter((t) => t.my);
}

export function getEnemyTowers() {
  return utils.getObjectsByPrototype(prototypes.StructureTower).filter((t) => !t.my);
}
