// Aggregate metrics across recent matches into a Claude/human-readable summary.
// Phase 0 stub — wired up to print a placeholder so `npm run report` doesn't error.

console.log(`evaluator/report.mjs — stub.

Phase 0: replay parser is not yet implemented. Once parseReplay is filled in
(Phase 1), this script will:

  1. Read the most recent N replay zips from the Arena client cache.
  2. Compute per-match metrics via evaluator/metrics.mjs.
  3. Aggregate into a summary: record, time-to-flag distribution, avg spread,
     enemy comp distribution, defensive-tick %, etc.
  4. Print as structured text suitable for a hypothesis-forming pass.

See docs/ITERATION-LOOP.md for the loop this report feeds.
`);
