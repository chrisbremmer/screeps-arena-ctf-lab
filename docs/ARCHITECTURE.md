# Architecture

## Goal of this document

This is the rationale, not the API reference. If you want to know *what* a layer does, read its source. If you want to know *why* the layers are arranged this way and what we considered first, read this.

## Constraints we're designing against

The shape of the bot is forced by what Screeps Arena actually is. The constraints below are load-bearing — most architectural choices fall out of them directly.

1. **The bot is a pure function of game state per tick.** `loop()` is called once per tick. There's no `Memory`, no persistence across matches. Module-level variables persist *within* a match only.
2. **Intents are tick-deferred.** `creep.move()` doesn't move anything — it queues an intent that resolves at end of tick. The last intent of a given type wins; some are mutually exclusive.
3. **No headless match runner publicly available** as of writing. The Steam client is the runner. CI cannot play matches; CI can only run unit tests on pure logic.
4. **CPU is per-tick wall-clock**, with a separate (larger) budget on tick 1. No bucket-style carry-over. Read it from `arenaInfo.cpuTimeLimit`.
5. **The map is small (100×100), the unit count is small (~14 a side), and there is no fog of war.** Everything is observable; the cost is in *deciding*, not *seeing*.
6. **Object identity is stable within a match but objects can disappear** (decay, death). Always re-resolve via `getObjectsByPrototype` per tick — don't cache references across ticks.

Any architecture that fights these constraints will lose to one that respects them.

## The core design choice: layered, top-down, snapshot-based

The bot is a strict 5-layer stack, each layer reducing its decisions to inputs for the layer below:

| Layer | Owns | Reads | Writes |
|---|---|---|---|
| **Commander** | strategy selection, play assignment, priority budget | snapshot, prior-tick commander state | play assignments per squad |
| **Plays** | the next macro intent ("rush", "river", "defend") | snapshot, commander assignments | squad targets |
| **Squads** | group movement, formation, cohesion | snapshot, squad target | per-creep micro intent |
| **Micro** | per-creep tactical reflex (kite / heal / engage) | snapshot, creep micro intent | game intents (`move`, `attack`, ...) |
| **Intel + Arena** | snapshot, threat scoring, body math | live `game` API | snapshot |

The discipline this enforces: **only `arena/snapshot.mjs` touches the live `game` API.** Everything above it consumes a plain `Snapshot` object. That is what makes the upper layers unit-testable in plain Node — feed micro a fake snapshot and assert on the intent it produces.

### Why a snapshot

Without it, every layer would re-call `getObjectsByPrototype` and re-filter, which is expensive (the typings hint at non-trivial cost) and produces inconsistent views as side effects mutate state. With it, every layer in a tick sees the same world, computed once, and the bot becomes deterministic given a snapshot. Determinism is the prerequisite for replay-driven debugging.

### Why per-creep state machines instead of behavior trees / utility AI

Two reasons:

1. **Debuggability.** When a creep does something stupid, "ranger micro entered KITE because it was at range 2 with HP 88" is trivially explainable. Behavior trees obscure which sub-behaviour fired. Utility AI obscures which utility scored highest. Both are technically more flexible; both are harder to argue about in a post-match retro.
2. **Scope.** We have ~14 creeps, three roles, maybe four states per role. That's a small product. The flexibility of BTs/UAI buys us nothing at this size and costs us inspection.

If we ever need adaptive per-creep behaviour we don't pre-anticipate, we'll revisit. We almost certainly won't at this scale.

### Why a central commander instead of per-creep autonomy

Per-creep autonomy is tempting because it parallelizes thinking and matches how Screeps World code is often structured. It loses to a central commander in CTF specifically because **the win condition and the highest-leverage play (river control) are both global**. Decisions like "abandon the current river-grab because the enemy collapsed on our flag" can't be made well from inside a single creep's perspective.

The commander is also where strategy detection lives. Reading the enemy's composition and adjusting the active play is a tick-1 decision that would be awkward to distribute.

## Alternatives considered

### Port-from-Screeps-World structure
Roles, missions, an empire-style hierarchy. Rejected — there are no rooms, no economy, no multi-room logistics. Most of the structure would be empty wrappers around three creep roles on one map. We start lean and add only when we feel pain.

### ECS
Genuinely tempting — entities map cleanly to game objects, components to roles/states, systems to per-tick passes. Rejected for now because (a) we're alone on the codebase and the ECS overhead isn't paying for itself yet, and (b) the Arena API is not data-oriented under the hood, so we'd be paying ECS costs while still calling object-oriented intents. If/when the bot grows past ~3000 lines and we feel coupling pain, this is the most likely place we revisit.

### KISS prototype-extension + free functions
What the JS starter does, and what most beginner bots do. Rejected — we're explicitly building for an *iteration loop*, not a one-shot. Free functions don't have a place to put strategy detection or play state cleanly, and they make multi-variant comparison painful.

### Hierarchical Task Network with strategy engine + plays + signals
The pattern qnz.one landed on after iterating through the above. We're effectively adopting a stripped-down version: commander = strategy engine, plays = plays, no formal "signal" abstraction yet because we don't have enough plays to need it. If we end up with >5 plays and the strategy logic gets tangled, we lift signals out as a real thing.

## Per-layer contracts

These are the contracts each layer commits to. Anything above the line is a guarantee; anything below is freedom to refactor.

### `arena/snapshot.mjs`

**Inputs:** the live `game` API.
**Outputs:** a plain object with:

- `tick`, `cpuLimit`, `ticksLeft`
- `myFlag`, `enemyFlag` (or `null` if captured)
- `myCreeps[]`, `enemyCreeps[]` — each augmented with role classification and effective body stats
- `bodyParts[]` — `BodyPart` objects on the river, sorted by accessibility
- `myTowers[]`, `enemyTowers[]`
- helpers: `creepById(id)`, `range(a, b)`, `inRange(a, b, n)`

**Guarantee:** consistent view; computed once per tick; safe to pass anywhere.

### `intel/`

Pure functions. No side effects, no game-API calls. Take a snapshot (and possibly other inputs), return numbers/objects.

- `threat.score(creep, snapshot)` → number
- `body.effective(creep)` → `{dps, healPerTick, hpEffective, fatigueGen, moveCount}`
- `body.growthRecommendation(creep, snapshot)` → `{partType, score, sourcePos}` or `null`
- `target.pick(squad, candidates, snapshot)` → creep | null
- `economy.towerChargePlan(snapshot)` → `{tower, source, ferries[]}[]` — which towers to charge, from which container, with which creeps. Returns `[]` if no `CARRY`-bearing creeps exist (we don't yet know whether starting bodies include `CARRY` — see `docs/CTF-RULES.md`).

### `micro/`

A function per role that takes `(creep, microIntent, snapshot)` and emits intents into the game API. Each is internally an FSM.

**Discipline:** micro never makes strategic decisions. If a ranger decides whether to kite or advance, that's micro. If it decides whether to abandon the current target to re-engage with the squad, that's the squad layer.

### `squads/`

A `Squad` is `{members, target, formation, micro state}`. It computes a centroid, decides the next group destination, and assigns micro intents to its members.

**Discipline:** squads don't pick what to do strategically. They execute the play assigned by the commander.

### `commander/plays/`

Each play is a module exporting `assign(squad, snapshot, playState)` and (optionally) `done(squad, snapshot, playState)`. Plays are stateful within a tick chain — they can carry state through `playState`, which the commander persists in module scope.

### `commander/`

`commander.tick(snapshot)`:
1. Update strategy (which play, who plays it).
2. Run plays, which mutate squads' targets / formations.
3. Run squads, which assign micro intents.
4. Run micro for each creep, which emits game intents.
5. Emit structured logs.

## Variant management

Variants live in `variants/` as full files. `src/main.mjs` re-exports the active one. `runner/swap-variant.mjs` rewrites the re-export.

Why files instead of feature flags:

- **Diffability.** Two variants compared side-by-side are the cleanest representation of a strategic experiment.
- **No flag rot.** Boolean flags inside the bot accumulate, get stale, and pollute the read of "what is this bot actually doing right now."
- **Reproducibility.** A variant filename pins the strategy at a moment in time. We can resurrect any past variant by name.

A variant module is allowed to import any layer below the commander but should not duplicate commander logic — if a variant needs to behave fundamentally differently, that means the commander needs a knob, not that the variant should re-implement the commander.

## Telemetry and evaluation

The bot emits structured logs (`arena/log.mjs`) — JSON-shaped lines prefixed with a tag, e.g. `[CTF-LOG] {"event":"flag-capture-attempt","tick":847,...}`. The evaluator (`evaluator/`) reads replay zips from the Steam client cache, extracts logs, and computes per-match metrics.

**Discipline:** the bot does not compute analytics. It only emits the events the evaluator needs. This keeps the per-tick CPU budget for tactics, not introspection.

## What we explicitly do not build (yet)

These would be reasonable in principle but don't pay for themselves at our current stage:

- **Custom self-play harness.** Without an official headless runner, building one is a project unto itself. We rely on ranked matches as our truth and the evaluator to give them resolution.
- **ELO tracking of variants.** We rely on the in-game ladder for now. If we end up wanting variant-vs-variant comparison without burning ranked matches, we revisit.
- **Behavior trees / utility AI.** See above.
- **A general "strategy" abstraction layer.** We have one strategy entry point in the commander. When we have three working strategies and they're tangled, we extract.

If you find yourself reaching for one of these, the question to ask is: *what evidence do we have that the lack of this is what's losing matches?* If the answer is "none yet," we don't build it.
