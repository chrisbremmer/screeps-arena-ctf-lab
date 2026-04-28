// Per-tick world snapshot. The only module that touches the live `game` API on the read path.
// Everything above this layer consumes the returned object — keeps higher layers unit-testable.

import { prototypes, utils } from "game";
import {
  getMyFlags,
  getEnemyFlags,
  getNeutralFlags,
  getCaptureTargets,
  getMyCreeps,
  getEnemyCreeps,
  getMyTowers,
  getEnemyTowers,
  getNeutralTowers,
  getAllContainers,
} from "./rules.mjs";
import { getCostMatrix } from "./cost-matrix.mjs";
import { classifyRole, countParts, PART } from "../intel/body.mjs";

// BodyPart prototype is CTF-specific and may not exist in all arenas. Probe
// at runtime; degrade to an empty list if unavailable.
function getBodyParts() {
  try {
    if (prototypes && prototypes.BodyPart) {
      return utils.getObjectsByPrototype(prototypes.BodyPart) || [];
    }
  } catch {
    /* fall through */
  }
  return [];
}

export function buildSnapshot() {
  const tick = utils.getTicks();

  const myCreeps = getMyCreeps().map(decorate);
  const enemyCreeps = getEnemyCreeps().map(decorate);

  return {
    tick,
    myFlags: getMyFlags(),
    enemyFlags: getEnemyFlags(),
    neutralFlags: getNeutralFlags(),
    captureTargets: getCaptureTargets(),
    myCreeps,
    enemyCreeps,
    myTowers: getMyTowers(),
    enemyTowers: getEnemyTowers(),
    neutralTowers: getNeutralTowers(),
    containers: getAllContainers(),
    bodyParts: getBodyParts(),
    costMatrix: getCostMatrix(),
    range: utils.getRange,
    findClosestByPath: utils.findClosestByPath,
    findInRange: utils.findInRange,
    findClosestByRange: utils.findClosestByRange,
  };
}

function decorate(creep) {
  // Attach role and part counts as advisory hints. We don't mutate the game
  // object's identity — these are reads-only conveniences.
  creep._role = classifyRole(creep);
  creep._parts = countParts(creep);
  creep._hasCarry = creep._parts[PART.CARRY] > 0;
  return creep;
}
