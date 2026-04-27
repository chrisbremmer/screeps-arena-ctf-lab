# screeps-arena-ctf-lab

A competitive **Screeps Arena (Season 2) Capture-the-Flag** bot, plus the iteration harness around it.

The repo is two things:

1. **`src/`** — the bot itself. Layered: a central commander dispatches *plays*, plays orchestrate *squads*, squads are made of creeps running *micro* state machines. The bot is what gets pushed into the Steam Arena client.
2. **Everything else** — a deliberate iteration loop so we can keep getting better. Variant management (`variants/`), a build-and-push runner (`runner/`), a replay/log evaluator (`evaluator/`), unit tests for tactical primitives (`tests/`), and design docs (`docs/`).

The thesis is simple: in a game where the only "ground truth" of strategy is ranked-match outcomes, the team that iterates fastest wins. This repo exists to make our iteration loop tight, honest, and resumable across sessions.

---

## Goal

Climb the Season 2 Capture-the-Flag (basic) leaderboard. Currently unranked under the handle **Capt Munchies**.

We are not optimizing for code elegance or generality. We are optimizing for **win rate against the matchmaker's mid-and-upper bracket**. Every architectural choice should answer the question: *does this make us iterate faster, or does it make us play better?* If neither, cut it.

## Why Capture the Flag

Picked over Power Split and Construct & Control for three reasons:

- **~3× the player volume** of the other two arenas (164 vs ~55 each at season open). More matches = faster ELO convergence and more strategic variety to learn from.
- **Tight problem scope.** No economy, no spawning, no construction. The optimization surface is movement, combat, body composition, and target selection — all directly testable, all amenable to systematic improvement.
- **One juicy optimization knob: the river.** Body parts spawn on the central swamp river and creeps can grow by stepping on them. That's a clean, high-leverage decision dimension to actually tune (when to grow, what to grow, who to grow) without the noise of full-economy management.

The tradeoff: CTF is also where the strongest players concentrate. We are climbing a steeper ladder. That's fine — the volume helps more than the difficulty hurts, and "being competitive in the most-played arena" is the thing we actually want.

## Capture the Flag — what the game actually is

A condensed working summary. The full version with sources lives at [`docs/CTF-RULES.md`](docs/CTF-RULES.md), and that doc is also where we track open questions to verify in-client.

- **Map.** 100×100 grid, opponents in opposite corners, a swamp **river** running through the middle.
- **Win condition.** Capture all enemy flags. In **basic** there's one flag per side, so it reduces to: get any one of your creeps onto the enemy flag tile.
- **Starting forces.** ~14 pre-spawned creeps per side, each starting with 4 of one role part (`ATTACK`, `RANGED_ATTACK`, or `HEAL`) plus 4 `MOVE`. Two static towers per side near the home flag.
- **Body growth.** `BodyPart` objects spawn on the river and decay over time. Stepping a creep onto one adds that part to the creep's body. **There is no other way to grow a creep**, no boosts, no economy. Adding role parts without matching `MOVE` increases fatigue.
- **No economy.** No `Source`, no `StructureSpawn`, no `Container`, no construction in basic CTF.
- **Match length.** ~2000 ticks. Read it from `arenaInfo.ticksLimit` — don't hard-code.
- **Vision.** Full vision of the map. No fog of war.
- **Tie-break.** Not publicly documented. Open question — verify in-client. We design assuming a tie is bad and we'd rather force a decision.

## Strategic thesis

The brief from the research pass and the public meta point to a concrete order-of-importance for what wins matches:

1. **River control.** Body parts on the river compound. A bot that systematically harvests the river while the opponent ignores it ends the match with substantially more effective firepower. This is the single highest-leverage thing to get right.
2. **Group cohesion + healer placement.** Naive flag-rush loses to a competent kiting opponent. Squads that move as a centroid, with healers protected and rangers extending only into healer range, beat looser formations consistently.
3. **Target prioritization.** Focus-fire on the lowest-effective-HP threat in range, especially enemy healers. Splash damage (`rangedMassAttack`) when surrounded.
4. **Strategy detection + counter-play.** On tick 1 we can read the enemy's body composition. Heavy-ranged opponents play differently from melee-heavy. Switch our play accordingly instead of running one rigid plan.
5. **Defensive sentry.** One healer parked under our towers near our flag costs cheap and prevents the cheesy single-runner rush.

Concrete tactics that fall out of those priorities live in [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md).

## Architecture overview

Layered, top-down. Each layer's only job is to reduce its decisions to inputs for the layer below it.

```
                ┌────────────────────┐
   tick ──────▶ │   Commander        │  Strategy detection, play selection,
                │   src/commander/   │  global threat triage, priority budget
                └─────────┬──────────┘
                          │ assigns squads → plays
                          ▼
                ┌────────────────────┐
                │   Plays            │  Discrete intents: rush-flag,
                │   src/commander/   │  river-control, defend-flag, regroup
                │      plays/        │
                └─────────┬──────────┘
                          │ moves squads → formations
                          ▼
                ┌────────────────────┐
                │   Squads           │  Group movement, formation centroid,
                │   src/squads/      │  cohesion, role positioning
                └─────────┬──────────┘
                          │ delegates to per-creep micro
                          ▼
                ┌────────────────────┐
                │   Micro            │  Per-creep FSMs: kite, advance,
                │   src/micro/       │  heal-allocate, engage, retreat
                └─────────┬──────────┘
                          │ reads
                          ▼
                ┌────────────────────┐
                │   Intel + Arena    │  World snapshot, threat scoring,
                │   src/intel/       │  body math, target selection,
                │   src/arena/       │  CTF-specific helpers
                └────────────────────┘
```

Why this shape:

- **Commander as the single decision-maker per tick** keeps strategy testable. We can serialize commander state and replay it.
- **Plays as discrete units** map cleanly onto the human/agent vocabulary ("we lost because we never switched off the rush play") and to the qnz.one HTN pattern that's recommended for Arena.
- **Squads** are the cohesion primitive. They own formation and group pathing so per-creep code doesn't have to.
- **Micro** is pure tactical reflex. It should be deterministic given inputs and unit-testable.
- **Intel + Arena** is the only layer that touches the live `game` API directly. Everything above it consumes a per-tick `Snapshot` object. This is what makes unit tests practical: feed micro a fake snapshot and assert on the intent it produces.

The full rationale, alternatives considered, and per-layer contracts are in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Repo layout

```
src/
  main.mjs                  # Entry — what the Arena client loads. Currently re-exports the active variant.
  arena/
    rules.mjs               # CTF constants, helpers (own/enemy flag, river bounds, body-part objects)
    snapshot.mjs            # Per-tick world snapshot: pre-computed views consumed by all higher layers
    log.mjs                 # Structured logging emitted into match output for the evaluator to parse
  commander/
    commander.mjs           # Top-level tick orchestrator
    strategy.mjs            # Strategy detection (read enemy comp, classify), play selection
    plays/
      rush-flag.mjs
      river-control.mjs
      defend-flag.mjs
      regroup.mjs
  squads/
    squad.mjs               # Squad: members + target + formation
    formation.mjs           # Centroid pathing, cohesion checks, role slots
  micro/
    ranger.mjs              # rangedAttack target prio, kite at range < 3
    healer.mjs              # heal vs rangedHeal allocation, retreat-when-isolated
    melee.mjs               # engage, attack, fall back when below threshold
    move.mjs                # Path helpers, fatigue-aware step picking
  intel/
    threat.mjs              # Per-enemy threat score (DPS, range, healers nearby)
    body.mjs                # Effective body stats, fatigue projection, growth recommendations
    target.mjs              # Target prioritization across the squad

variants/
  v0-baseline.mjs           # First measurable strategy. main.mjs re-exports this initially.
  README.md                 # How to add a variant, naming, what to record.

runner/
  push.mjs                  # Build (no transpile yet) and copy main.mjs to the client folder
  swap-variant.mjs          # Switch which variant src/main.mjs re-exports
  config.mjs                # Local-only path config for the client folder

evaluator/
  parse-replay.mjs          # Read Steam client replay zips
  metrics.mjs               # Per-match KPIs: time-to-flag, river-capture-rate, KDR, etc.
  report.mjs                # Render a human/Claude-readable summary

tests/
  body.test.mjs
  formation.test.mjs
  threat.test.mjs

docs/
  ARCHITECTURE.md           # Detailed rationale, per-layer contracts, alternatives considered
  CTF-RULES.md              # Verified mechanics + open questions
  ITERATION-LOOP.md         # How human + Claude + harness collaborate
  PLAYBOOK.md               # Concrete tactics with rationale and counter-plays

typings/game/               # Vendored Arena typings for editor + checkJS support
```

## The iteration loop

This is the part that matters most. The architecture is in service of this loop, not the other way around.

```
            ┌──────────────────────────────────────────┐
            │ 1. Hypothesis                            │
            │    "Healers should rangedHeal at range 2 │
            │    instead of moving in to heal."        │
            └───────────────────┬──────────────────────┘
                                │
                                ▼
            ┌──────────────────────────────────────────┐
            │ 2. Variant                               │
            │    Copy variants/v0-baseline.mjs →       │
            │    variants/v1-healer-rangedheal.mjs.    │
            │    Change only the relevant micro.       │
            └───────────────────┬──────────────────────┘
                                │
                                ▼
            ┌──────────────────────────────────────────┐
            │ 3. Tests                                 │
            │    npm test — tactical primitives must   │
            │    still pass. Add a test for the new    │
            │    behaviour.                            │
            └───────────────────┬──────────────────────┘
                                │
                                ▼
            ┌──────────────────────────────────────────┐
            │ 4. Push                                  │
            │    npm run variant -- v1-healer-rangedh… │
            │    npm run push                          │
            └───────────────────┬──────────────────────┘
                                │
                                ▼
            ┌──────────────────────────────────────────┐
            │ 5. Play ranked (≥10 matches)             │
            │    The Steam client is the runner.       │
            └───────────────────┬──────────────────────┘
                                │
                                ▼
            ┌──────────────────────────────────────────┐
            │ 6. Evaluate                              │
            │    npm run report — Claude reads the     │
            │    structured summary, identifies what   │
            │    actually changed, proposes the next   │
            │    hypothesis.                           │
            └───────────────────┬──────────────────────┘
                                │
                                ▼
                         (back to step 1)
```

Two non-obvious choices worth flagging:

- **Variants are full files, not flags.** A variant is a self-contained module that imports the layers it needs. We deliberately do *not* gate behaviour with boolean flags inside the bot — that pollutes intent and makes the active strategy hard to reason about. Diffing two variants is the unit of strategic comparison.
- **The evaluator runs offline against replays, not live.** The bot itself stays minimal and CPU-cheap. All telemetry it needs to emit is structured `console.log` lines that the evaluator parses post-hoc. This keeps the bot's per-tick budget for combat decisions, not introspection.

[`docs/ITERATION-LOOP.md`](docs/ITERATION-LOOP.md) has the playbook for working with Claude inside this loop.

## Roadmap

Phase boundaries are deliberate — each one delivers a measurable jump and unblocks the next. We don't skip ahead.

### Phase 0 — Baseline (this commit)
- Layered scaffolding in place.
- `variants/v0-baseline.mjs` — minimal CTF strategy: classify creeps by body, single squad, rush enemy flag, ranger kite + healer protect + melee engage. **Intentionally weak.** Its job is to be the floor we measure against.
- Docs and iteration loop documented.

### Phase 1 — Telemetry & evaluator
- Structured logging from the bot (`arena/log.mjs`).
- Replay zip parser (`evaluator/parse-replay.mjs`).
- Per-match metrics: time-to-flag, river-parts-captured, KDR by role, average squad cohesion radius, % ticks with fatigue > 0.
- `npm run report` produces a Claude-consumable summary.
- **Exit criterion:** we can read 10 ranked matches and articulate, with numbers, *why* we lost.

### Phase 2 — River control v1
- `commander/plays/river-control.mjs` with a real prioritization (which body part to grab, who should grab it, when to abort).
- `intel/body.mjs` projects fatigue if we add part X to creep Y, declines pickups that would slow the squad.
- **Exit criterion:** measurable +N% body-parts-captured vs v0 with non-negative win rate.

### Phase 3 — Strategy detection + counter-plays
- Read enemy composition on tick 1 + early movement signal.
- Branch into `rush-flag` / `river-control` / `defend-flag` based on the read.
- A/B against v2 in ranked, keep what wins.

### Phase 4 — Squad micro polish
- Cohesion-aware ranger kiting (don't kite out of healer range).
- Healer triage with a real damage-rate model.
- Target priority: enemy healers > low-HP threats > nearest.

Phase 5+ is whatever the data tells us. We don't plan past where the evidence reaches.

## Local development

### Prereqs
- Node ≥ 20 (`.nvmrc`).
- The Steam client **Screeps: Arena**, with a configured local-bot folder (Preferences → "Path to your bot scripts").

### One-time setup
```sh
cp runner/config.example.mjs runner/config.mjs
# edit runner/config.mjs to point at your client's bot folder
```

### Develop
```sh
# run the unit tests for tactical primitives
npm test

# pick which variant is active (writes src/main.mjs to re-export it)
npm run variant -- v0-baseline

# build (currently a copy — no transpile) and push to the Arena client
npm run push

# after playing matches in-client, summarize what happened
npm run report
```

The loop is: edit a variant → `npm test` → `npm run push` → play ≥10 ranked matches → `npm run report` → form next hypothesis.

## Open questions

These are unresolved as of writing. We will answer them empirically inside the client, not by guessing. Tracked in [`docs/CTF-RULES.md`](docs/CTF-RULES.md).

- Exact mix among the 14 starting creeps in 2026 basic CTF (rangers / healers / melee).
- Tie-breaking rule when `ticksLimit` is reached.
- Whether replay zips have a stable schema we can parse without reverse-engineering each season.
- Whether the matchmaker biases toward similar-rank opponents early (affects how much signal we get from the first 20 games).
- Whether Season 2 changed any rule beyond disabling `Date` in player code.

## Status

Phase 0. Scaffolding committed; v0 baseline pushed; nothing fielded yet.

— Capt Munchies
