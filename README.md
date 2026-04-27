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

A condensed working summary, sourced from the in-app description. The full version with open questions lives at [`docs/CTF-RULES.md`](docs/CTF-RULES.md).

- **Map.** Opposing corners, a swamp **river** running through the middle, mid-map contested objectives.
- **Win condition.** Leave the opponent with **zero flags**. Stepping a creep onto a non-our flag captures it.
- **4 flags total.** 1 at our base + 1 at theirs + **2 neutral mid-map flags**. Each flag has a tower linked to it. Neutral flags are capture targets for both sides.
- **Towers must be charged.** Every tower starts empty. A tower with no energy is inert. Energy comes from **containers** placed near every tower; a creep with `CARRY` capacity ferries it into the tower. Tower-charging tempo is a strategic dimension, not a side-quest.
- **Starting forces.** 14 creeps per side with **mixed bodies**. Read the actual mix on tick 1; don't hard-code. We don't yet know whether starting creeps include `CARRY` — it's the highest-priority open question.
- **Body growth.** `BodyPart` objects spawn on the river. Confirmed types: `RANGED_ATTACK`, `ATTACK`, `HEAL`, `MOVE`. Stepping a creep onto one adds that part to its body **at zero hits** — fragile, but the capability is immediate.
- **Match length.** **2000 ticks.** Read from `arenaInfo.ticksLimit` regardless.
- **Tick-out tie-break.** Whoever controls more flags. Equal counts = draw. Holding ≥2 flags at tick 2000 is a guaranteed non-loss.

## Strategic thesis

Five priorities, ordered by expected leverage. This list reflects the actual arena mechanics — earlier drafts of this README were based on an older design and have been corrected.

1. **Tower-charging tempo.** Whichever side gets a charged tower first in any region (home, neutral, enemy) dominates that region. The home tower is the cornerstone of defensive viability; the neutral towers anchor the mid-map fight.
2. **Flag count over flag identity.** The win condition counts flags, not which flag. A captured neutral is as valuable as a captured enemy flag. Optimize for ending with ≥3 flags or, at minimum, ≥2.
3. **River control.** Body parts compound effective firepower. Pickup priority should reflect what the squad needs — `MOVE` to keep up, then role parts that the squad lacks. Zero-hit fragility means a freshly-grown creep is also more vulnerable.
4. **Group cohesion + healer placement.** Squads that hold formation outdamage and outheal squads that don't. Healers under tower coverage and within heal-range of their squad is the baseline.
5. **Strategy detection + counter-play.** Read enemy composition on tick 1 and their early movement to classify their plan (rush / contest mid / defend). Switch our play instead of running one rigid plan.

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
    rules.mjs               # CTF constants, multi-flag helpers, tower/container helpers, river bounds
    snapshot.mjs            # Per-tick world snapshot: pre-computed views consumed by all higher layers
    log.mjs                 # Structured logging emitted into match output for the evaluator to parse
  commander/
    commander.mjs           # Top-level tick orchestrator
    strategy.mjs            # Strategy detection (read enemy comp, classify), play selection
    plays/
      contest-flag.mjs      # Squad targets a non-our flag (enemy or neutral) for capture
      defend-flag.mjs       # Sentry/recall behaviour on a flag we own
      charge-tower.mjs      # CARRY-bearing creeps ferry energy from container → tower
  squads/
    squad.mjs               # Squad: members + target + formation
    formation.mjs           # Centroid pathing, cohesion checks, role slots
  micro/
    ranger.mjs              # rangedAttack target prio, kite at range < 3
    healer.mjs              # heal vs rangedHeal allocation, retreat-when-isolated
    melee.mjs               # engage, attack, fall back when below threshold
    worker.mjs              # CARRY ferry: withdraw from container, transfer to tower
    move.mjs                # Path helpers, fatigue-aware step picking
  intel/
    threat.mjs              # Per-enemy threat score (DPS, range, healers nearby)
    body.mjs                # Effective body stats, fatigue projection, growth recommendations
    target.mjs              # Target prioritization across the squad
    economy.mjs             # Tower charge level, container reserves, energy ferry plan

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
- `variants/v0-baseline.mjs` — minimal multi-flag CTF strategy: classify creeps by body, capture closest non-our flag, charge home tower if we have CARRY-bearing creeps, defend home flag with a sentry. **Intentionally weak.** Its job is to be the floor we measure against and to log the data we need to answer the open questions.
- Docs, iteration loop, and agentic-workflow plan documented.

### Phase 1 — Telemetry & evaluator
- Structured logging from the bot (already wired in `arena/log.mjs`).
- Replay zip parser (`evaluator/parse-replay.mjs`).
- Per-match metrics: flag-control history, time-to-first-tower-charge, river-parts-captured, KDR by role, average squad cohesion radius, % ticks with fatigue > 0.
- `npm run report` produces a Claude-consumable summary.
- **Exit criterion:** we can read 10 ranked matches and articulate, with numbers, *why* we lost.

### Phase 2 — Tower-charging tempo
- Real `charge-tower` play with priority logic: home tower first, then nearest neutral.
- `intel/economy.mjs` projects expected tower-up time given current ferry capacity.
- **Exit criterion:** measurable +N% time-with-charged-home-tower vs v0 with non-negative win rate.

### Phase 3 — River control
- `commander/plays/river-control.mjs` with real pickup prioritization (which part, who should grab it, when to abort).
- Fatigue projection declines pickups that would slow the squad below cohesion speed.
- **Exit criterion:** +N% body-parts-captured vs v0 with non-negative win rate.

### Phase 4 — Strategy detection + counter-plays
- Read enemy composition on tick 1 + early movement signal.
- Branch into rush / contest-mid / defend based on the read.
- A/B against v3 in ranked, keep what wins.

### Phase 5 — Squad micro polish
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

These are unresolved as of writing. We answer them empirically inside the client, not by guessing. Tracked in [`docs/CTF-RULES.md`](docs/CTF-RULES.md).

- **Top priority:** do any of the 14 starting creeps have `CARRY` parts? If not — and `CARRY` doesn't spawn on the river — tower-charging may be impossible and the entire economy story collapses. v0 logs tick-1 body composition specifically to answer this.
- Whether all 4 body-part icons (R/A/H/M) are actually exhaustive of what spawns on the river.
- Whether new (zero-hit) body parts regenerate hits over time.
- Tower behaviour once charged: auto-fire, or driven via intents (`tower.attack`/`heal`/`repair`)?
- Whether containers refill or contain a fixed starting amount.
- Whether stepping on a flag captures instantly or requires ending the tick on it.
- Whether replay zips have a stable schema we can parse without reverse-engineering each season.
- Whether the matchmaker biases toward similar-rank opponents early.

## Status

Phase 0. Scaffolding committed; v0 baseline pushed; nothing fielded yet.

— Capt Munchies
