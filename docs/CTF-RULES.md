# Capture the Flag — verified rules and open questions

**Source of truth:** the in-app description on the Capture the Flag (Basic level, β) arena card. Rules below match that description verbatim where quoted; community/2022-era write-ups are *not* authoritative for this version of the arena and have been removed from this doc. Anything still uncertain is in the [Open questions](#open-questions) section.

## Win condition

> *Capture all enemy Flags by stepping on them with one of your creeps before they capture yours. To win, you must leave your opponent with **zero Flags at the same moment**.*

So:

- "Capturing" a flag = stepping a creep on its tile.
- A captured flag becomes yours (`my === true`).
- You win the instant the opponent has zero flags they own.
- "At the same moment" matters: if you and the opponent each capture each other's last flag on the same tick, the win condition isn't met for either of you (both still have ≥1).

## Map and starting setup

- 14 creeps per side with **mixed body compositions** ("different bodies" — read the actual mix from `MY_CREEPS` on tick 1, don't assume).
- **Per side at base:** 1 flag + 1 *empty* tower + (presumed) containers near the tower with energy.
- **Mid-map, neutral:** **2 additional flags**, each linked to its own tower. Containers near every tower.
- **Map total: 4 flags** (mine, enemy's, 2 neutrals) and **4 towers** (mine, enemy's, 2 neutrals at mid-map flags).
- A swamp **river** runs across the middle. Body-part objects spawn on it.

## Towers — must be charged

> *The Towers must be charged with energy to deal damage or heal. Energy is available in multiple Containers near every tower.*

Every tower starts empty. A tower with no energy is inert. To use a tower:

1. A creep with `CARRY` capacity must `withdraw` energy from a nearby container.
2. That creep must `transfer` the energy into the tower.
3. The tower can then be commanded (or auto-fires? — see [Open questions](#open-questions)).

Implication: tower-charging tempo is a strategic dimension. The first side to charge their home tower has a significant defensive advantage; the first side to charge a neutral tower wins the mid-map fight around that flag.

## Body parts on the river

> *There are items called BodyPart that are generated sometimes in the middle of the river. When your creep steps on such an object, an additional body part gets added to its body **(with zero hits)**.*

- Spawn types confirmed in the description's icons: **R (RANGED_ATTACK), A (ATTACK), H (HEAL), M (MOVE)**. `CARRY` and `WORK` are *not* shown — see [Open questions](#open-questions).
- New parts are added at **zero hits**. They contribute to body length and effective capability but do *not* tank damage. The next damage instance can destroy them.
- Strategic implication: a creep that just picked up a `RANGED_ATTACK` is more dangerous *and* more fragile until the new part regenerates hits (if it ever does — see [Open questions](#open-questions)).

## Time limit and tie-break

> *The time limit is 2000 ticks. When the time limit is expired, the player controlling more flags wins. In case of a tie, the match is declared a draw.*

- 2000 ticks confirmed. Read it from `arenaInfo.ticksLimit` in code regardless.
- Tick-out tie-break: **flag count.** Equal counts = draw.
- Strategic implication: holding ≥2 flags at tick 2000 is a guaranteed non-loss (you're at minimum 2 vs 2 = draw, vs 2 > 1 = win). The 2-flag floor is a real fallback objective when winning is out of reach.

## API quirks worth knowing

(General Arena API, not CTF-specific.)

- No `Memory`. Module-level state persists within a match only; matches start cold.
- Object IDs are stable within a match; objects can disappear (decay, death). Don't cache references across ticks — re-resolve via `getObjectsByPrototype`.
- Intents queue per tick; last-write-wins for the same intent type on the same object. Some intent pairs are mutually exclusive.
- Per-tick CPU is wall-clock at `arenaInfo.cpuTimeLimit`; tick 1 has a separate larger budget at `arenaInfo.cpuTimeLimitFirstTick`. Use `getCpuTime()` (nanoseconds) to measure.
- `Date` is disabled in player code as of Season 2.

## Flag identification

The in-app sample uses:

```js
var enemyFlag = getObjectsByPrototype(Flag).find(object => !object.my);
```

Note `!object.my` is true for **both** enemy flags (`my === false`) **and** neutral flags (`my === undefined`). The sample treats them as equivalent capture targets — and the win condition supports this: any non-our flag is a capture candidate, and capturing a neutral flag both takes a flag off the table for the enemy *and* gives us tower control.

Helpers in our code should be tri-state-aware:

- `getMyFlags()` — `my === true` (we can own multiple)
- `getEnemyFlags()` — `my === false`
- `getNeutralFlags()` — `my === undefined`
- `getCaptureTargets()` — anything where `!my` (matches the in-app sample)

## Open questions

These are unresolved as of writing. We answer them empirically inside the client, not by guessing further. The v0 strategy logs the data we need to answer them.

1. **Do any of the 14 starting creeps have `CARRY` or `WORK` parts?** The body-part icons on the arena card show only R/A/H/M — `CARRY` is not depicted as river-spawnable. If starting creeps don't have `CARRY` and the river doesn't spawn it, **tower-charging may be impossible** in basic CTF, and our entire economy story collapses. **First in-client log to capture: tick-1 body composition for all 14 creeps.**

2. **Are all body-part types actually spawnable on the river?** The icons show 4 types but the description doesn't claim those are exhaustive. Log every `BodyPart` we observe across the first 5 matches.

3. **Do new (zero-hit) body parts regenerate hits over time?** If yes, on what cadence? If no, they're effectively single-use power-ups. Watch a creep's body across consecutive ticks after it picks up a part.

4. **Tower behaviour:** once charged, do they auto-fire on hostile creeps in range, or do they expose intents we drive (`tower.attack(target)` / `tower.heal(target)` / `tower.repair(target)`)? Both are plausible in Screeps idiom.

5. **Container energy regeneration:** do containers refill, or is the starting energy all there is? Affects whether economy is a sustained ferry job or a one-off charge.

6. **Path/visual obstacles around mid-map flags.** The screenshots show varied terrain. Are mid-map flags reachable by direct path from both sides equally? Worth measuring distance/cost from spawn to each non-my flag on tick 1.

7. **Does stepping on a flag instantly capture it,** or does it require ending the tick on the flag tile? Affects path planning around the capture.

8. **Replay zip schema** on macOS. Where is the cache, what's inside, can we parse it. Phase 1 work.

9. **Matchmaker behaviour** — does it bias toward similar-rank opponents? Affects how much signal we get from the first 20 ranked games.

The answers will be added back into this doc as they're resolved, with the source (replay ID, tick, observation) noted.

## Source

- In-app description on the Capture the Flag (Basic level, β) arena card, observed Apr 2026.

This file supersedes any community write-up or 2022-era source on basic CTF mechanics — those described an earlier design that the current arena does not match.
