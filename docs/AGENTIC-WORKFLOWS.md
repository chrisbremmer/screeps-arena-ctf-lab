# Agentic workflows

How we use Claude (and related tooling) to make iteration faster, without pretending we can automate things that aren't actually automatable.

## The constraint that shapes everything

There is **no public headless match runner** for Screeps Arena. The Steam client is the match runner, and ranked matches require a human pressing Play. That means:

- Iteration speed is bottlenecked by **your ranked-match throughput**, not by Claude's. Roughly 10 matches per variant for honest signal. So we get ~10 hypotheses tested per ~50–100 matches played.
- An "autonomous loop" that proposes new variants every 30 seconds adds nothing — there's no signal source between human-played matches.
- The right design philosophy is **workflow density**, not autonomy: make every human-Claude interaction inside the loop fast, structured, and resumable.

Every entry below is evaluated against that constraint.

## What we're actually building

A pipeline shaped like:

```
play matches → journal/ → /ctf-report → /new-variant → npm test → npm run push → play matches → ...
```

Most of the steps are short. The ones that aren't (synthesis after a match batch, scaffolding a new variant) are exactly where Claude earns its keep.

## Tier 1 — implemented now

These are live in this repo as of the same commit that introduced this doc.

### `CLAUDE.md` at repo root
Loaded into every Claude Code session in this repo. Defines: where things live, the iteration loop, naming conventions, when to ask before acting, the open questions queue. Saves ~10 minutes of re-priming per session.

### `.claude/commands/new-variant.md`
Slash command for the variant ceremony: pick the next number, branch from the current baseline, scaffold the file + a paired test, run tests, hand the user the swap/push commands. Refuses on vague hypotheses ("make it better") because vague variants confound results. Does *not* swap the active variant — that's a human decision.

### `evaluator/parse-console.mjs` + `npm run report`
The Arena client doesn't store replays on disk — there is no replay-zip cache to parse. The console of the in-client replay viewer *is* the data source. `pbpaste | npm run report -- --journal --opponent "<name>"` reads a console paste, extracts the `[CTF]` event stream, computes flag-control / capture / cohesion metrics, and appends a structured entry to `journal/YYYY-MM-DD.md`. ~30 sec per match instead of ~5 min of writing notes.

### `.claude/commands/match-log.md`
Fallback slash command for cases where `npm run report` doesn't fit (no console paste, batch multi-match summary, manual flagging of things the parser missed).

### `.claude/commands/ctf-report.md`
Slash command for the synthesis step. Reads recent journal entries, refuses if N < 10, proposes a single hypothesis with rationale and counter-arguments, hands off to the user for greenlight. Refuses to propose multiple hypotheses — we can only afford to test one at a time.

## Tier 2 — when Phase 1 lands

These become valuable once the replay parser produces structured per-match metrics. Don't build before then.

### Claude Code Action on PRs
GitHub Action runs Claude Code review on every PR that touches `variants/` or `src/`. Bar to clear before merge:

- Variant has a paired test.
- Variant follows the architectural contract (no commander rewrite, no shared-code mutation that would change baseline behaviour).
- Variant's hypothesis statement is in the commit message and matches what the code actually does.

This becomes worthwhile when there are enough variants in flight that the human review surface is meaningful — probably v3+.

### Scheduled weekly rollup
Use the `schedule` skill to fire a Sunday-evening job:

> Read `journal/` entries from the past week, the current variant, and the latest ranked rating. If we climbed: summarize what changed and what we should keep doing. If we didn't: produce a candidate hypothesis backlog (≤3 items) for the user to pick from on Monday.

The output is a digest the user can read in 60 seconds Monday morning. This is the closest thing to "autonomous progress" that's actually useful — not autonomous play, autonomous reflection.

## Tier 3 — only if data justifies

Don't build any of these until we have evidence the lack of them is what's losing matches.

### MCP server exposing parsed-replay tools
A small local MCP server with tools like `read_recent_replays`, `query_match_metrics`, `compare_variants`. Useful only if Claude is reading replay data often enough that the slash-command path is the bottleneck. Premature now.

### Custom subagent type for tactical research
A subagent specialized in finding prior-art bot strategies, parsing community Discord/Steam threads, returning a structured tactical brief. Useful if the open-source bot landscape grows or if we hit a strategic plateau and need outside input. Probably never necessary.

### Self-play harness
Hypothetically: a custom in-Steam-client driver that switches `main.mjs` between two variants and records outcomes from local matches. Massive engineering effort, requires reverse-engineering the client's local-match flow, and saves us human-played-match cost only if we want variant-vs-variant signal we can't get from the live ladder. Almost certainly not worth it.

## Anti-recommendations

Things to avoid even though they sound appealing:

- **Don't run autonomous loops that "improve the bot" between matches.** No useful signal source between human plays. Loops with no input become hallucination factories.
- **Don't push replay processing to cloud agents.** Replays live in the Steam client cache. Locality matters; round-trips don't help.
- **Don't accumulate memory entries** for things that belong in `CLAUDE.md`. Durable instructions are file (version-controlled, reviewable, shared). Memory is for ephemeral cross-session state — and this project doesn't have much of that.
- **Don't add a chat agent that auto-PRs variants.** Every variant should be a deliberate hypothesis test with a human greenlight. Auto-PR'd variants are noise that wastes ranked rating.
- **Don't ladder Claude as the player.** Even if it were technically possible, the rating you'd be climbing wouldn't be yours.

## How to extend this list

- New entries go in the tier they belong to. Don't move existing entries between tiers without explaining why the constraint changed.
- Anti-recommendations are first-class — write them down so future-you knows what was already considered and rejected.
- The bar for promoting Tier 2 → Tier 1 (or Tier 3 → Tier 2) is **specific evidence from match data** that the absence is costing us rating. "It would be cool" is not evidence.
