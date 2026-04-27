import { test } from "node:test";
import assert from "node:assert/strict";
import { parseConsole } from "../evaluator/parse-console.mjs";

test("parseConsole: single event on its own line", () => {
  const text = `[CTF] {"event":"init","tick":1}`;
  const events = parseConsole(text);
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "init");
  assert.equal(events[0].tick, 1);
});

test("parseConsole: multiple events on a single line (no newlines)", () => {
  const text = `[CTF] {"event":"a","tick":1}[CTF] {"event":"b","tick":2}`;
  const events = parseConsole(text);
  assert.equal(events.length, 2);
  assert.deepEqual(events.map((e) => e.event), ["a", "b"]);
});

test("parseConsole: events scattered across lines with line-number prefixes", () => {
  const text = [
    '1 1   [CTF] {"event":"init","tick":1}',
    '2 50  [CTF] {"event":"tick","tick":50,"mine":14}',
    '3 100 [CTF] {"event":"tick","tick":100,"mine":13}',
  ].join("\n");
  const events = parseConsole(text);
  assert.equal(events.length, 3);
  assert.equal(events[2].mine, 13);
});

test("parseConsole: nested objects parse correctly", () => {
  const text = `[CTF] {"event":"init","tick":1,"flags":{"mine":[{"x":3,"y":3}],"enemy":[{"x":96,"y":96}]}}`;
  const events = parseConsole(text);
  assert.equal(events.length, 1);
  assert.equal(events[0].flags.mine[0].x, 3);
  assert.equal(events[0].flags.enemy[0].y, 96);
});

test("parseConsole: handles braces inside string literals", () => {
  const text = `[CTF] {"event":"x","msg":"a } trick"}`;
  const events = parseConsole(text);
  assert.equal(events.length, 1);
  assert.equal(events[0].msg, "a } trick");
});

test("parseConsole: skips a malformed entry but continues with the next", () => {
  const text = `[CTF] {bad json}[CTF] {"event":"good","tick":1}`;
  const events = parseConsole(text);
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "good");
});

test("parseConsole: empty input returns empty array", () => {
  assert.deepEqual(parseConsole(""), []);
  assert.deepEqual(parseConsole("nothing here"), []);
});

test("parseConsole: extracts events from a realistic screeps console paste", () => {
  // Simulates the formatting we observed in the Apr 2026 test match: line numbers,
  // tabs, two events on one wrapped line, one truncated entry mid-paste.
  const text = `1\t1\t[CTF] {"event":"init","tick":1,"myCount":14,"enemyCount":14}
\t\t[CTF] {"event":"carry-present","value":true}
2\t50\t[CTF] {"event":"tick","tick":50,"strategy":"rush","mine":14,"enemy":14,"myFlagCount":1,"enemyFlagCount":1,"neutralFlagCount":2,"mainSpread":5}
3\t100\t[CTF] {"event":"tick","tick":100,"strategy":"rush","mine":14,"enemy":14,"myFlagCount":2,"enemyFlagCount":1,"neutralFlagCount":1,"mainSpread":40}
4\t150\t[CTF] {"event":"tick","tick":150,"strategy":"rush","mine":14,"enemy":7,"myFlagCount":2,"enemyFlagCount":1,"neutralFlagCount":1,"mainSpread":79}[CTF] {"event":"tick","tick":200,"strategy":"rush","mine":14,"enemy":0,"myFlagCount":3,"enemyFlagCount":1,"neutralFlagCount":0,"mainSpread":58}
[CTF] {"event":"truncated`;

  const events = parseConsole(text);
  assert.equal(events.length, 6);
  assert.equal(events[0].event, "init");
  assert.equal(events[1].event, "carry-present");
  assert.equal(events[1].value, true);
  assert.equal(events[5].myFlagCount, 3);
});
