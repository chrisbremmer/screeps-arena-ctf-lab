// Top-level tick orchestrator. Builds squads, picks plays, dispatches.
//
// v0 allocation:
//   - Workers (creeps with CARRY) → charge-tower play, ferry energy.
//   - One healer → defend-flag play, sentry our home flag.
//   - Everyone else → contest-flag play, capture the closest non-our flag.
//
// We deliberately run the contest squad against the closest non-our flag at
// each tick so the squad re-targets after a successful capture. There's no
// long-horizon planning here — Phase 2+ owns that.

import { buildSnapshot } from "../arena/snapshot.mjs";
import { logEvent, logTick } from "../arena/log.mjs";
import { ROLE, PART } from "../intel/body.mjs";
import { makeSquad, runSquad, assignFerryTask } from "../squads/squad.mjs";
import { assignContestFlag } from "./plays/contest-flag.mjs";
import { assignDefendFlag } from "./plays/defend-flag.mjs";
import { planChargeTower } from "./plays/charge-tower.mjs";
import { pickStrategy, readEnemyComp } from "./strategy.mjs";

let _initLogged = false;

export function tickV0() {
  const snapshot = buildSnapshot();

  if (!_initLogged) {
    logFirstTick(snapshot);
    _initLogged = true;
  }

  const strategy = pickStrategy(snapshot);

  // Partition our creeps.
  const carryers = snapshot.myCreeps.filter((c) => c._hasCarry);
  const nonCarry = snapshot.myCreeps.filter((c) => !c._hasCarry);

  // Sentry: first available healer among non-carry creeps.
  const sentry = nonCarry.find((c) => c._role === ROLE.HEALER) ?? null;
  const main = nonCarry.filter((c) => c !== sentry);

  // Build squads.
  const squads = [];
  if (main.length > 0) squads.push(makeSquad("main", main));
  if (sentry) squads.push(makeSquad("sentry", [sentry]));
  // Carryers form their own squad even if all on ferry duty, so combat-falling-through
  // works if there are no charge tasks available.
  if (carryers.length > 0) squads.push(makeSquad("workers", carryers));

  // Plays.
  for (const squad of squads) {
    if (squad.name === "main") assignContestFlag(squad, snapshot);
    else if (squad.name === "sentry") assignDefendFlag(squad, snapshot);
    else if (squad.name === "workers") {
      // Workers: assign each ferry task to its creep, then any unassigned worker
      // falls through to a contest-flag advance for combat help.
      const tasks = planChargeTower(snapshot, carryers);
      for (const task of tasks) assignFerryTask(squad, task.creep, { tower: task.tower, container: task.container });
      // If no tasks at all (no targets or no energy in containers), fall through to contest.
      if (tasks.length === 0) assignContestFlag(squad, snapshot);
    }
    runSquad(squad, snapshot);
  }

  if (snapshot.tick % 50 === 0) {
    logTick(snapshot.tick, {
      strategy,
      mine: snapshot.myCreeps.length,
      enemy: snapshot.enemyCreeps.length,
      myFlagCount: snapshot.myFlags.length,
      enemyFlagCount: snapshot.enemyFlags.length,
      neutralFlagCount: snapshot.neutralFlags.length,
      mainSpread: squads.find((s) => s.name === "main")?.spread ?? 0,
    });
  }

  // Win/loss condition checks for telemetry — useful even before the evaluator can parse replays.
  if (snapshot.enemyFlags.length === 0 && snapshot.neutralFlags.length === 0 && snapshot.myFlags.length > 0) {
    logEvent("all-non-my-flags-captured", { tick: snapshot.tick, myFlagCount: snapshot.myFlags.length });
  }
  if (snapshot.myFlags.length === 0) {
    logEvent("lost-all-my-flags", { tick: snapshot.tick });
  }
}

function logFirstTick(snapshot) {
  // High-priority: log every starting creep's body composition. Answers the
  // open question on whether CARRY exists in starting bodies.
  const bodies = snapshot.myCreeps.map((c) => ({
    id: c.id,
    role: c._role,
    parts: c._parts,
    pos: { x: c.x, y: c.y },
  }));
  const enemyBodies = snapshot.enemyCreeps.map((c) => ({
    id: c.id,
    role: c._role,
    parts: c._parts,
    pos: { x: c.x, y: c.y },
  }));

  logEvent("init", {
    tick: snapshot.tick,
    myCount: snapshot.myCreeps.length,
    enemyCount: snapshot.enemyCreeps.length,
    enemyComp: readEnemyComp(snapshot),
    flags: {
      mine: snapshot.myFlags.map((f) => ({ x: f.x, y: f.y })),
      enemy: snapshot.enemyFlags.map((f) => ({ x: f.x, y: f.y })),
      neutral: snapshot.neutralFlags.map((f) => ({ x: f.x, y: f.y })),
    },
    towers: {
      mine: snapshot.myTowers.map((t) => ({ x: t.x, y: t.y })),
      enemy: snapshot.enemyTowers.map((t) => ({ x: t.x, y: t.y })),
      neutral: snapshot.neutralTowers.map((t) => ({ x: t.x, y: t.y })),
    },
    containers: snapshot.containers.map((c) => ({
      x: c.x,
      y: c.y,
      energy: c.store?.energy ?? c.store?.["energy"] ?? 0,
    })),
    myCarryers: snapshot.myCreeps.filter((c) => c._hasCarry).length,
    bodies,
    enemyBodies,
  });

  // Convenience flag for the evaluator: carry-presence is the single piece of
  // data that determines whether the v0 economy code does anything.
  logEvent("carry-present", { value: snapshot.myCreeps.some((c) => c._hasCarry) });
}

// Re-export under the previous name for variant compatibility.
export { tickV0 as tick };
