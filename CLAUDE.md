# CLAUDE.md — repo-scoped instructions for Claude Code

This file is loaded automatically into every Claude Code session in this repo. It exists so future sessions can be productive without re-priming.

## What this repo is

Competitive Screeps Arena Season 2 **Capture the Flag** bot (`Capt Munchies`), plus the iteration harness around it. The goal is climbing the ranked ladder, not exploring or learning. Optimize for win rate, not for code elegance.

Read in order if you're new to the project: `README.md` → `docs/CTF-RULES.md` → `docs/ARCHITECTURE.md` → `docs/ITERATION-LOOP.md` → `docs/PLAYBOOK.md` → `docs/AGENTIC-WORKFLOWS.md`.

## How to be useful here

**Default behaviours:**

- **Hypothesis first.** Don't propose code without a hypothesis it tests. "Make it better" is not a request — it's a smell.
- **Smallest change that tests the hypothesis.** Big variants confound results. One change at a time.
- **Variant + test in the same pass.** A variant without a test is a regression in waiting.
- **Push back on weak hypotheses.** If the data doesn't support a claim, say so.
- **Log first, decide later** for in-client open questions. We have a list of mechanics we haven't verified — don't assume.

**Where things live:**

- `main.mjs` (repo root) — the Arena client's entry point. Re-exports the active variant. Rewritten by `runner/swap-variant.mjs`.
- `src/` — bot code. Layered: commander → plays → squads → micro → intel/arena.
- `variants/` — A/B'd strategy variants. `./main.mjs` (at root) re-exports the active one.
- `runner/` — variant swap. `push.mjs` is currently a no-op (the Arena client watches the repo directly).
- `evaluator/` — replay parser + metrics. Phase 0 stubs; Phase 1 work.
- `tests/` — pure-Node unit tests on tactical primitives. CI runs on every PR.
- `docs/` — design docs. Update them when behaviour changes; they're load-bearing.
- `journal/` — match outcome notes (created lazily by the `/match-log` skill).
- `typings/game/` — vendored Arena typings. Don't edit — copy from a known-good source if updating.

## Conventions worth knowing

- **No `Memory`.** Module-level state persists within a match only; matches start cold.
- **Don't import `game/*` in pure modules.** `intel/` and below should be testable under plain Node. The runtime values for `game/constants` are stable strings — define mirror constants locally if needed (see `src/intel/body.mjs`).
- **One snapshot per tick.** Only `src/arena/snapshot.mjs` touches the live `game` API on the read path. Higher layers consume the snapshot.
- **Variants are full files, not feature flags.** `runner/swap-variant.mjs` switches the active one. Don't gate behaviour with booleans inside the bot.
- **Naming.** `vN-short-description.mjs` for variants. N is monotonic; retired numbers don't get reused.
- **Tests.** `node:test` style. Run with `npm test`. Add a test for any new tactical primitive.
- **Commits.** New commit per logical change; don't amend. Co-author tag in commit messages is fine.
- **Don't push to `main` without testing.** Run `npm test` and ideally one in-client match before pushing.

## When to ask before acting

Default: act. The user has explicitly asked for autonomous progress on most things. But check first when:

- A change would invalidate a fielded variant's data.
- A doc rewrite is large enough to lose nuance the user added.
- An open question in `docs/CTF-RULES.md` is load-bearing for the proposed change. Confirm the design assumption with the user, or run an in-client logging match to resolve the question.
- Considering a new dependency, a new build tool, or a new layer in the architecture. The bar for adding scope is high.

## Open questions queue

Live list in `docs/CTF-RULES.md` § Open questions. Highest priority right now: **do starting creeps have CARRY parts?** Until that's confirmed, the v0 economy code is a logged no-op.

## Anti-patterns specific to this project

- **Don't write strategic code without measuring first.** "I think kiting at range 4 is better" is a hypothesis, not a fix. Field it as a variant and read the data.
- **Don't accumulate variants on top of each other.** When a variant wins, retire the loser; the new variant becomes the baseline. We don't grow a forest of half-considered branches.
- **Don't add metrics the evaluator can't surface yet.** Logging is cheap, but a metric we can't read is just noise.
- **Don't replicate the JS starter's prototype-extension style.** The starter is illustrative, not competitive — its style fights our layered architecture.

## Slash commands

Repo-local skills under `.claude/commands/`. Use them:

- `/new-variant <name>` — scaffold the next variant + a paired test.
- `/match-log` — capture the outcome of a recent batch of ranked matches into `journal/`.
- `/ctf-report` — synthesize the latest journal entries and propose the next hypothesis.

## Memory

Persistent memory at `/Users/chris.bremmer/.claude/projects/-Users-chris-bremmer-ScreepsArena-tutorial/memory/` — note this path predates the new repo and was bound to the tutorial directory. When this becomes relevant, update or migrate. Don't store ephemeral state here; durable instructions belong in this CLAUDE.md.
