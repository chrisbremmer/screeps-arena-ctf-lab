# Capture the Flag — verified rules and open questions

This is the working reference for what the basic CTF arena actually does. Some entries are confirmed by official sources; others are inferred from public community write-ups (mostly 2022 era) and need verification in-client. Each section flags its source confidence.

## Win condition

**Confirmed.** From the typed schema:

> *Flag … Capture all flags to win the game.*  ([typed-screeps-arena flag.d.ts](https://raw.githubusercontent.com/screepers/typed-screeps-arena/season-beta/dist/arena/season_beta/capture_the_flag/basic/prototypes/flag.d.ts))

Each `Flag` exposes `my: boolean | undefined`. Neutral flags read `undefined`; ownership flips to `true` once captured. In **basic** there is one flag per side, so the win condition reduces to: **step any one of your creeps onto the enemy flag's tile**.

Advanced CTF has 3 flags (2 corner + 1 center, 1 tower over the center one). Out of scope for now.

## Map layout

**Confirmed by community sources, not the official typings.**

- **100×100 grid.**
- Opponents start in opposite corners.
- A **swamp river** runs through the middle of the map, with `BodyPart` objects spawning on it.
- Each side has **2 static towers** near its home flag (basic was reduced from a higher count in the April 2022 changelog).

Source: [Steam changelog Aug 2021](https://steamcommunity.com/app/1137320/discussions/0/3078754800913642994/?ctp=3), summarized by Winsley.

## Starting forces

**Partially confirmed.**

- ~14 creeps per side. Confirmed across multiple community sources.
- Each starting creep has **4 of one role part (`ATTACK`, `RANGED_ATTACK`, or `HEAL`) + 4 `MOVE`**.
- The starter JS code classifies creeps by which role part they carry — read role from body, don't hard-code per-position.

**Open question:** the exact mix among the 14 (e.g. 4 rangers / 4 healers / 4 melee / 2 misc). The starter code reads it dynamically from `MY_CREEPS` — we should do the same.

## Body growth — the core CTF mechanic

**Confirmed.**

- `BodyPart` objects spawn on the central river over time.
- Stepping a creep onto a `BodyPart` adds that part to the creep's body.
- Each `BodyPart` has `ticksToDecay` and disappears if not collected.
- **No other growth mechanism exists in basic CTF.** No boosts, no containers, no economy.

Implications we'll design around:

- Each role part added without a corresponding `MOVE` increases fatigue per move-tick. A ranger that picks up `RANGED_ATTACK` without `MOVE` becomes slower than the squad it's in.
- Body part *types* on the river vary. A grab decision is not just "is it close" — it's "does this part make this creep more useful to the squad's current play."
- The river is contested. Two creeps trying for the same part is a real situation; either pre-arbitrate or accept that one will waste a move.

## Match length

**Confirmed at the API level, value not.**

- Match cap is `arenaInfo.ticksLimit`. Always read it; don't hard-code.
- Basic arenas were ~2000 ticks per community sources. Advanced was 10,000.

**Open question:** what happens at the limit if neither flag is captured? Tie? Loss for both? Decided by remaining HP / creep count? **Not publicly documented.** Verify in-client by intentionally stalling a match.

## Vision

**Confirmed.** Full vision of the entire map. No fog of war.

(Devs noted in the alpha they might experiment with FoW later. No 2026 announcement reversing full-vision found.)

## Resources, economy, structures

**Confirmed.** None of the following exist in basic CTF:

- No `Source`
- No `StructureSpawn`
- No `StructureContainer` / `StructureExtension`
- No construction sites

The only structures present are the home towers and the flags.

## Towers

**Confirmed at API level, behaviour partially.**

Each side has 2 static towers near the home flag. Standard tower constants apply (`TOWER_RANGE`, `TOWER_POWER_ATTACK`, falloff, cooldown).

**Open question:** towers are static — can they be ordered to attack/heal/repair as in classic Screeps, or are they autonomous? We should test, but assume autonomous defense unless proven otherwise.

## API quirks

**Confirmed across multiple sources.**

- `Memory` does not exist. Module-level state persists within a match only; every match starts cold.
- Object IDs are stable within a match; objects can disappear. Re-resolve via `getObjectsByPrototype` per tick rather than caching references across ticks.
- Intents are queued, not immediate. Last-write-wins for the same intent type on the same object in one tick. Some intent pairs are mutually exclusive.
- Per-tick CPU budget is wall-clock, exposed via `arenaInfo.cpuTimeLimit`. Tick 1 has a separate (larger) budget at `arenaInfo.cpuTimeLimitFirstTick`. Use `getCpuTime()` (nanoseconds) to measure.
- `Date` is disabled in player code as of Season 2 (per the end-of-Season-1 patch notes).
- `spawnCreep` returns an object even on failure — verify by checking next tick.

## Open questions to resolve in-client

These are unresolved as of writing. We answer them empirically inside the client, not by guessing further:

1. **Tie-break rule** when `ticksLimit` is reached. Stall a match deliberately to find out.
2. **Exact starting creep mix** among the 14. Read it from `MY_CREEPS` on tick 1 and log it across the first 5 matches to confirm consistency.
3. **Tower behaviour.** Are they truly autonomous, or do they expose intents we can drive?
4. **Body-part spawn cadence.** Rate, type distribution, and any pattern (random vs. zoned). Log every `BodyPart` observed for the first 10 matches.
5. **Replay zip schema.** Stable across season patches? Documented anywhere? We need this for the evaluator.
6. **Matchmaker behaviour.** Does it bias toward similar-rank opponents early? Affects how much signal we get from the first 20 ranked games.
7. **Season 2 rule changes.** Beyond the disabled `Date` object, are any CTF rules different from the 2022-era write-ups?

The answers will be added back into this doc as they're resolved, with the source (replay ID, tick, observation) noted.

## Sources

Primary:

- Typed schema: [screepers/typed-screeps-arena (season-beta)](https://github.com/screepers/typed-screeps-arena/tree/season-beta)
- JS starter: [screepers/screeps-arena-javascript-starter](https://github.com/screepers/screeps-arena-javascript-starter)

Community:

- Designing a Screeps Arena bot — [qnz.one, July 2022](https://qnz.one/2022/07/25/designing-a-screeps-arena-bot/)
- Screeps Arena notes — [Jon Winsley](https://jonwinsley.com/notes/screeps-arena)
- Steam discussion / changelogs — [Screeps: Arena on Steam](https://steamcommunity.com/app/1137320/discussions/)
