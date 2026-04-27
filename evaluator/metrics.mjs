// Compute per-match metrics from a parsed event stream.
// Pure — no I/O, no game-API access. Easy to test against synthetic events.

const STARTING_FLAGS = { my: 1, enemy: 1, neutral: 2 };

// Split a multi-match event stream by `init` boundaries. Each `init` starts a
// new match; events between inits belong to the prior match. Returns an array
// of per-match event arrays (always at least one, even if no init was seen).
export function splitMatches(events) {
  const matches = [];
  let current = [];
  for (const e of events) {
    if (e.event === "init" && current.length > 0) {
      matches.push(current);
      current = [];
    }
    current.push(e);
  }
  if (current.length > 0) matches.push(current);
  return matches.length > 0 ? matches : [[]];
}

export function computeMetrics(events) {
  const init = events.find((e) => e.event === "init") ?? null;
  const carry = events.find((e) => e.event === "carry-present");
  const ticks = events.filter((e) => e.event === "tick").sort((a, b) => a.tick - b.tick);
  const lostAll = events.find((e) => e.event === "lost-all-my-flags");
  const wonAll = events.find((e) => e.event === "all-non-my-flags-captured");

  const finalTick = events.reduce((m, e) => Math.max(m, e.tick ?? 0), 0);

  const flagTimeline = ticks.map((t) => ({
    tick: t.tick,
    my: t.myFlagCount ?? null,
    enemy: t.enemyFlagCount ?? null,
    neutral: t.neutralFlagCount ?? null,
  }));

  const captures = [];
  let prev = { ...STARTING_FLAGS };
  for (const t of ticks) {
    const cur = { my: t.myFlagCount, enemy: t.enemyFlagCount, neutral: t.neutralFlagCount };
    if (cur.my > prev.my) {
      const sourceWasNeutral = cur.neutral < prev.neutral;
      const sourceWasEnemy = cur.enemy < prev.enemy;
      captures.push({
        tick: t.tick,
        type: "we-captured",
        from: sourceWasNeutral ? "neutral" : sourceWasEnemy ? "enemy" : "unknown",
      });
    }
    if (cur.my < prev.my) captures.push({ tick: t.tick, type: "we-lost" });
    prev = cur;
  }

  // Outcome inference. Explicit events win; otherwise infer from the last tick.
  let outcome = "unknown";
  let outcomeSource = "no-data";
  if (lostAll) {
    outcome = "loss";
    outcomeSource = "explicit:lost-all-my-flags";
  } else if (wonAll) {
    outcome = "likely-win";
    outcomeSource = "explicit:all-non-my-flags-captured";
  } else if (ticks.length > 0) {
    const last = ticks[ticks.length - 1];
    const ours = last.myFlagCount ?? 0;
    const theirs = (last.enemyFlagCount ?? 0) + (last.neutralFlagCount ?? 0);
    if (ours > theirs) {
      outcome = "likely-win";
      outcomeSource = "inferred:final-tick-flag-count";
    } else if (ours < theirs) {
      outcome = "likely-loss";
      outcomeSource = "inferred:final-tick-flag-count";
    } else {
      outcome = "likely-draw";
      outcomeSource = "inferred:final-tick-flag-count";
    }
  }

  const spreads = ticks.map((t) => t.mainSpread).filter((s) => typeof s === "number");
  const avgSpread = spreads.length ? mean(spreads) : null;
  const peakSpread = spreads.length ? Math.max(...spreads) : null;

  const creepTimeline = ticks.map((t) => ({
    tick: t.tick,
    mine: t.mine ?? null,
    enemy: t.enemy ?? null,
  }));

  return {
    finalTick,
    outcome,
    outcomeSource,
    init,
    carryPresent: carry?.value ?? null,
    flagTimeline,
    captures,
    avgSpread,
    peakSpread,
    creepTimeline,
    eventCount: events.length,
  };
}

function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
