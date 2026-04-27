// Structured logging for evaluator consumption.
//
// All log lines are prefixed with [CTF] and carry a JSON payload. The evaluator
// parses these out of replay output. Keep payloads small — they're written every tick
// and we have a per-tick CPU budget.

const TAG = "[CTF]";

export function logEvent(event, data = {}) {
  // Stringify lazily to skip cost when console output is suppressed.
  console.log(`${TAG} ${JSON.stringify({ event, ...data })}`);
}

export function logTick(tick, summary) {
  console.log(`${TAG} ${JSON.stringify({ event: "tick", tick, ...summary })}`);
}
