// Per-tick world snapshot. The only module that touches the live `game` API on the read path.
// Everything above this layer consumes the returned object — keeps higher layers unit-testable.

import { utils } from "game";
import {
  getMyFlag,
  getEnemyFlag,
  getMyCreeps,
  getEnemyCreeps,
  getMyTowers,
  getEnemyTowers,
} from "./rules.mjs";
import { classifyRole } from "../intel/body.mjs";

export function buildSnapshot() {
  const tick = utils.getTicks();
  const myFlag = getMyFlag();
  const enemyFlag = getEnemyFlag();

  const myCreeps = getMyCreeps().map(decorate);
  const enemyCreeps = getEnemyCreeps().map(decorate);

  return {
    tick,
    myFlag,
    enemyFlag,
    myCreeps,
    enemyCreeps,
    myTowers: getMyTowers(),
    enemyTowers: getEnemyTowers(),
    range: utils.getRange,
    findClosestByPath: utils.findClosestByPath,
    findInRange: utils.findInRange,
    findClosestByRange: utils.findClosestByRange,
  };
}

function decorate(creep) {
  // Attach role and body summary as non-enumerable hints. We don't mutate the
  // game object's identity — these are advisory.
  creep._role = classifyRole(creep);
  return creep;
}
