# CLAUDE.md — repo-scoped instructions for Claude Code

This file is loaded automatically into every Claude Code session in this repo. It exists so future sessions can be productive without re-priming.

## What this repo is

Competitive Screeps Arena Season 2 **Capture the Flag** bot (`Capt Munchies`), plus the iteration harness around it. The goal is climbing the ranked ladder, not exploring or learning. Optimize for win rate, not for code elegance.

Read in order if you're new to the project: `README.md` → `docs/CTF-RULES.md` → `docs/ARCHITECTURE.md` → `docs/ITERATION-LOOP.md` → `docs/PLAYBOOK.md` → `docs/AGENTIC-WORKFLOWS.md`.

## Current state (last updated 2026-04-28)

**Active variant:** v6-harvest-and-focus (reverted from v9). **Current rating:** ~189. **Iteration paused** pending Arena S2 CTF finals on **2026-05-02** — that's the first opportunity to observe top-tier CTF play; the public corpus before then is empty and we've exhausted it (Winsley + LittleSound is the ceiling, three derivatives all lost).

**Variant trajectory (record / Δ rating per 10 matches):**

| Variant | Result | Key change |
|---|---|---|
| v0 placement | 3W-2L from 445 | baseline (cohesion broken, no towers, contest-flag) |
| v1-hold-at-two-flags | 1W-9L, -37 | wrong hypothesis; cohesion bug upstream |
| v2-fortress-2-flags | 2W-6L-2D, -14 | COHESION_RADIUS bug locked squad immobile |
| v3-fortress-advancing | 2W-7L-1D, -37 | radius fixed; mechanically sound but no conversion |
| v4-push-with-advantage | 4W-5L-1D, +2 | first net-positive: push at material advantage ≥4 |
| v5-rush-defense | 4W-4L-2D, +5 | LittleSound's defense state + telemetry |
| v6-harvest-and-focus | 5W-5L, +3 | river harvest + squad focus fire + healer triage |
| v7-tempo | 4W-4L-2D, -2 | road-aware pathing + loose cohesion; net flat |
| v8-omnibus | 0W-9L-1?, -65 | bundled cost-matrix + ranger mass + healer prio + tower-zone; collapsed, reverted |
| v9-mass-and-heal | 0W-8L-2D, -51 | inherited silent v7/v8 src drift after main.mjs-only revert; deep regression |
| **revert to v6 (a8235d7)** | — | full src + main.mjs restored to last-positive state; on disk: v7/v8/v9/v10 kept for diff reference |

**Critical retro finding from v9:** when v8 was reverted earlier, only `main.mjs` was flipped — the v7/v8 src-level changes (cost-matrix passed to every `moveTo`, ranger mass-attack, healer-priority -0.6, tower-zone filter) were silently retained. So "v6 active" since the v8 commit was not the v6 that scored +3, and v9 inherited that drift. **Lesson: a variant revert must restore `src/` to the target commit, not just rewrite `main.mjs`.**

**In-flight (uncommitted) work:** v10-rolling-fortress scaffolded on disk (`variants/v10-rolling-fortress.mjs`, `src/commander/plays/anchor-and-hold.mjs`, `src/micro/fortress.mjs`, `src/squads/fortress-formation.mjs`, `tests/v10-rolling-fortress.test.mjs`, plus a small `src/commander/commander.mjs` diff to wire in fortress squads). **Do not field** until post-finals research informs whether this hypothesis is worth a slot.

**Confirmed mechanics (don't re-investigate):**
- Towers do **not** auto-fire — manual `tower.attack(target)` required.
- TOWER_CAPACITY = 10, TOWER_ENERGY_COST = 10, TOWER_COOLDOWN = 10. One shot per fill, 10-tick cooldown.
- TOWER_POWER_ATTACK = 1000 at range 1, falloff -50/tile. (Possible Steam-reported 4× bug from May 2022; verify empirically if testing tower DPS specifically.)
- **Tower ownership transfers on flag capture** — verified via `myTowerCount` flipping 1→2→3 with captures.
- `creep.transfer()` to non-my tower = ERR_NOT_OWNER. Cannot pre-charge neutral towers.
- BodyPart objects on the river have `type` and `ticksToDecay` only — no zero-hits gotcha.
- Match starts use a randomized corner: sometimes NW (mine flag at 3,3), sometimes SE (mine at 96,96). The bot is corner-agnostic via `findHomeFlag` (Chebyshev distance to home tower).

**Known unsolved problems:**
- **Repeat losses to specific bots.** `WarNeverChanges v10` beat us twice in the v6 batch — that bot has a counter we haven't identified. Watching the replay is the highest-leverage next step.
- **Fast rushes (~300 tick losses)** still happen vs aggressive opponents like `promiscuousemu v2`. Rush-defense recall fires but doesn't always hold.
- **Push-then-recapture cycle** in some long losses: `2-1-1 → 3-1-0 → 2-2-0 → 3-1-0` ending at 1-3.
- **Bundled-variant blast radius.** v8 and v9 each combined multiple changes; both regressed catastrophically and gave us no signal about which component was at fault. One change at a time, always.

**What's queued for after the finals:**
1. **Watch the finals.** First observable top-tier CTF play; expect to learn more from one finals match than from another 30 ranked games at 189.
2. **Watch the WarNeverChanges replay** — repeat-loss pattern is invisible in tick logs.
3. **Re-evaluate v10-rolling-fortress** against whatever the finals reveal; ship only if the hypothesis still holds.

**Known unknowns I'd want answered eventually:**
- The 4× TOWER_POWER_ATTACK bug — is real damage 1000 or 250? Test by logging enemy `hits` before/after a single tower shot.
- Are workers actually walking to charge the captured-neutral tower, or is the tower being charged some other way? Add per-creep position telemetry to see.
- Spawn rate and type distribution of body parts on the river (not yet measured).

**Workflow conventions specific to this stage:**
- Each new variant gets ~10 ranked matches before evaluation.
- Pipe console output through `pbpaste | npm run report -- --journal --opponent "<name>"` after each match (or batch).
- The screenshot of "10 rating games" is the source of truth for W/L; tick logs sometimes cross match boundaries when the bot module isn't reloaded between matches.
- **Reverts must touch `src/`, not just `main.mjs`.** Re-run `npm run variant -- v6-harvest-and-focus` (which rewrites `main.mjs`) *and* `git checkout <good-commit> -- src/` to fully restore.

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
- `evaluator/` — `parse-console.mjs` extracts `[CTF]` events from a pasted console blob; `metrics.mjs` computes per-match KPIs; `report.mjs` is the CLI (`npm run report`). Phase 1 is wired here. There is no replay-zip cache on disk — the Arena client only stores cached HTTP assets, not match state. Don't reach for one.
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
