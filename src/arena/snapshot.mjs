// Per-tick world snapshot. The only module that touches the live `game` API on the read path.
// Everything above this layer consumes the returned object — keeps higher layers unit-testable.

import { utils } from "game";
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
import { classifyRole, countParts, PART } from "../intel/body.mjs";

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
