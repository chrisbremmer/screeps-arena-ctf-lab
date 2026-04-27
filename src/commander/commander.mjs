// Top-level tick orchestrator. Builds the squads, picks strategy, runs plays,
// dispatches squads. The loop entry point in each variant calls into this.

import { buildSnapshot } from "../arena/snapshot.mjs";
import { logEvent, logTick } from "../arena/log.mjs";
import { ROLE } from "../intel/body.mjs";
import { makeSquad, runSquad } from "../squads/squad.mjs";
import { assignRushFlag } from "./plays/rush-flag.mjs";
import { assignDefendFlag } from "./plays/defend-flag.mjs";
import { pickStrategy, readEnemyComp, STRATEGY } from "./strategy.mjs";

let _initLogged = false;

export function tickV0() {
  const snapshot = buildSnapshot();

  if (!_initLogged) {
    logEvent("init", {
      tick: snapshot.tick,
      myCount: snapshot.myCreeps.length,
      enemyComp: readEnemyComp(snapshot),
      myFlag: snapshot.myFlag ? { x: snapshot.myFlag.x, y: snapshot.myFlag.y } : null,
      enemyFlag: snapshot.enemyFlag ? { x: snapshot.enemyFlag.x, y: snapshot.enemyFlag.y } : null,
    });
    _initLogged = true;
  }

  const strategy = pickStrategy(snapshot);

  // v0 squad split: one healer stays as flag sentry; everyone else goes on the rush.
  const sentry = snapshot.myCreeps.find((c) => c._role === ROLE.HEALER) ?? null;
  const main = snapshot.myCreeps.filter((c) => c !== sentry);

  const squads = [];
  if (main.length > 0) squads.push(makeSquad("main", main, null));
  if (sentry) squads.push(makeSquad("sentry", [sentry], null));

  for (const squad of squads) {
    if (squad.name === "sentry") assignDefendFlag(squad, snapshot);
    else assignRushFlag(squad, snapshot);
    runSquad(squad, snapshot);
  }

  if (snapshot.tick % 50 === 0) {
    logTick(snapshot.tick, {
      strategy,
      mine: snapshot.myCreeps.length,
      enemy: snapshot.enemyCreeps.length,
      mainSpread: squads.find((s) => s.name === "main")?.spread ?? 0,
    });
  }

  if (strategy === STRATEGY.RUSH && !snapshot.enemyFlag) {
    logEvent("flag-captured", { tick: snapshot.tick });
  }
}
