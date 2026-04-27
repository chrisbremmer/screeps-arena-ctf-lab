// Per-match KPIs computed from a parsed replay. Pure functions; tested
// against synthetic log streams.

export function computeMetrics(replay) {
  if (!replay || !replay.logs) return null;

  const init = replay.logs.find((l) => l.event === "init");
  const flagCapture = replay.logs.find((l) => l.event === "flag-captured");

  return {
    matchId: replay.matchId,
    ticks: replay.ticks,
    outcome: replay.outcome,
    timeToFlag: flagCapture ? flagCapture.tick : null,
    enemyComp: init?.enemyComp ?? null,
    avgSpread: avg(replay.logs.filter((l) => l.event === "tick").map((l) => l.mainSpread ?? 0)),
  };
}

function avg(xs) {
  if (!xs || xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
