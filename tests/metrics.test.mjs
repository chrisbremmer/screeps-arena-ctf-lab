import { test } from "node:test";
import assert from "node:assert/strict";
import { computeMetrics } from "../evaluator/metrics.mjs";

const tickEvent = (tick, my, enemy, neutral, mine = 14, enemyCt = 14, spread = 0) => ({
  event: "tick",
  tick,
  myFlagCount: my,
  enemyFlagCount: enemy,
  neutralFlagCount: neutral,
  mine,
  enemy: enemyCt,
  mainSpread: spread,
});

test("computeMetrics: empty input → unknown outcome", () => {
  const m = computeMetrics([]);
  assert.equal(m.outcome, "unknown");
  assert.equal(m.finalTick, 0);
  assert.equal(m.eventCount, 0);
});

test("computeMetrics: explicit lost-all-my-flags → loss", () => {
  const m = computeMetrics([
    { event: "init", tick: 1 },
    { event: "lost-all-my-flags", tick: 350 },
  ]);
  assert.equal(m.outcome, "loss");
  assert.equal(m.outcomeSource, "explicit:lost-all-my-flags");
  assert.equal(m.finalTick, 350);
});

test("computeMetrics: final-tick infer — likely-win when we hold all flags", () => {
  const m = computeMetrics([
    { event: "init", tick: 1 },
    tickEvent(50, 1, 1, 2),
    tickEvent(100, 3, 1, 0),
  ]);
  assert.equal(m.outcome, "likely-win");
  assert.equal(m.outcomeSource, "inferred:final-tick-flag-count");
});

test("computeMetrics: detects neutral capture in timeline", () => {
  const m = computeMetrics([
    tickEvent(50, 1, 1, 2),
    tickEvent(100, 2, 1, 1),
  ]);
  assert.equal(m.captures.length, 1);
  assert.equal(m.captures[0].type, "we-captured");
  assert.equal(m.captures[0].from, "neutral");
  assert.equal(m.captures[0].tick, 100);
});

test("computeMetrics: detects we-lost in timeline", () => {
  const m = computeMetrics([
    tickEvent(50, 1, 1, 2),
    tickEvent(100, 0, 1, 2),
  ]);
  assert.equal(m.captures.find((c) => c.type === "we-lost").tick, 100);
});

test("computeMetrics: avg + peak spread", () => {
  const m = computeMetrics([
    tickEvent(50, 1, 1, 2, 14, 14, 5),
    tickEvent(100, 1, 1, 2, 14, 14, 79),
    tickEvent(150, 1, 1, 2, 14, 14, 30),
  ]);
  assert.equal(m.peakSpread, 79);
  assert.equal(Math.round(m.avgSpread), 38);
});

test("computeMetrics: carry-present pulled from event", () => {
  const m = computeMetrics([
    { event: "init", tick: 1 },
    { event: "carry-present", tick: 1, value: true },
  ]);
  assert.equal(m.carryPresent, true);
});
