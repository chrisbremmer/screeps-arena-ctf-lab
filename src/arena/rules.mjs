// CTF-specific helpers and constants. Anything that's "true because this is the CTF arena"
// (rather than "true because this is Screeps") lives here.

import { prototypes, utils } from "game";

export const COHESION_RADIUS = 3;
export const KITE_RANGE = 3;
export const HEAL_RANGE = 1;
export const RANGED_HEAL_RANGE = 3;
export const RANGED_ATTACK_RANGE = 3;
export const MELEE_RANGE = 1;
export const TRANSFER_RANGE = 1;
export const WITHDRAW_RANGE = 1;

// Flags — tri-state ownership: my === true / false / undefined.
export function getAllFlags() {
  return utils.getObjectsByPrototype(prototypes.Flag);
}

export function getMyFlags() {
  return getAllFlags().filter((f) => f.my === true);
}

export function getEnemyFlags() {
  return getAllFlags().filter((f) => f.my === false);
}

export function getNeutralFlags() {
  return getAllFlags().filter((f) => f.my === undefined);
}

// Capture targets: any flag that isn't ours. Matches the in-app sample's `!object.my` idiom,
// which is true for both enemy (false) and neutral (undefined).
export function getCaptureTargets() {
  return getAllFlags().filter((f) => !f.my);
}

// Creeps.
export function getMyCreeps() {
  return utils.getObjectsByPrototype(prototypes.Creep).filter((c) => c.my && !c.spawning);
}

export function getEnemyCreeps() {
  return utils.getObjectsByPrototype(prototypes.Creep).filter((c) => !c.my);
}

// Towers.
export function getMyTowers() {
  return utils.getObjectsByPrototype(prototypes.StructureTower).filter((t) => t.my === true);
}

export function getEnemyTowers() {
  return utils.getObjectsByPrototype(prototypes.StructureTower).filter((t) => t.my === false);
}

export function getNeutralTowers() {
  return utils.getObjectsByPrototype(prototypes.StructureTower).filter((t) => t.my === undefined);
}

// Containers — which "side" they're on (proximity to my/their towers) is computed
// by the economy layer, not here.
export function getAllContainers() {
  return utils.getObjectsByPrototype(prototypes.StructureContainer);
}
