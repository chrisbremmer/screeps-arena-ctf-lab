# Capture the Flag — verified rules and open questions

**Sources of truth, in order:**
1. The in-app arena card description (rules, win condition, time limit).
2. **First-tick init logs from a Test match (Apr 2026)** — exact body compositions, map layout, container starting energy, flag/tower positions. See [Verified from logs](#verified-from-logs) for the data.

Rules quoted from the in-app description are reproduced verbatim. Community/2022-era write-ups are *not* authoritative and have been removed from this doc. Anything still uncertain is in the [Open questions](#open-questions) section.

## Win condition

> *Capture all enemy Flags by stepping on them with one of your creeps before they capture yours. To win, you must leave your opponent with **zero Flags at the same moment**.*

So:

- "Capturing" a flag = stepping a creep on its tile.
- A captured flag becomes yours (`my === true`).
- You win the instant the opponent has zero flags they own.
- "At the same moment" matters: if you and the opponent each capture each other's last flag on the same tick, the win condition isn't met for either of you (both still have ≥1).

## Map and starting setup

**Confirmed from Apr 2026 init logs.** The map is **diagonally symmetric** along the SW↔NE river axis. Every match opens with the same layout (relative to which corner is yours):

```
NW ── my base ──────────── neutral NE
 (3,3)   flag              (84,15) flag
 (2,2)   tower             (83,16) tower
 (1,1)   container 1000e   (87,12) container 1000e
                  \\
            r i v e r
                    \\
neutral SW ──────────── enemy base SE
(16,83) flag               (96,96) flag
(17,82) tower              (97,97) tower
(13,86) container 1000e    (98,98) container 1000e
```

- **14 creeps per side**, body composition table below.
- **4 flags total**: yours (corner), enemy's (opposite corner), 2 neutrals on the off-diagonal corners.
- **4 towers** — one per flag, all empty at match start.
- **4 containers** — one near each tower, **each with 1000 energy at match start.**
- Both neutral flags are roughly equidistant (~80 tiles Chebyshev) from both bases, each across the river from its closer base.
- A swamp **river** cuts across the SW↔NE diagonal. Body-part objects spawn on it.

### Starting bodies (verified, both sides identical)

| Role | Count | Body | Notes |
|---|---|---|---|
| Worker | 2 | `3×CARRY + 6×MOVE` (9 parts) | The economy ferry. Move-balanced even on swamp. |
| Healer | 4 | `6×HEAL + 6×MOVE` (12 parts) | Move-balanced on plain; swamp halves their speed. |
| Ranger | 4 | `6×RANGED_ATTACK + 6×MOVE` (12 parts) | Move-balanced on plain. |
| Melee | 4 | `3×ATTACK + 3×TOUGH + 6×MOVE` (12 parts) | **TOUGH means melee are tanks, not strikers.** 3 ATTACK = only 90 dmg/tick at range 1. |

Strategic implications baked into the bodies:

- **Workers carry 150 energy** (3 × CARRY_CAPACITY=50). One worker fills a tower in roughly one trip.
- **Melee are damage absorbers, not damage dealers.** Their job is to soak fire for the rangers behind them, not to win fights.
- **All creeps have 6 MOVE** — full mobility on plain terrain. Cohesion is achievable at no fatigue cost.
- **Both sides are identical.** Until river-growth diverges them, all wins come from positioning, sequencing, and strategic choices.

## Towers — must be charged

> *The Towers must be charged with energy to deal damage or heal. Energy is available in multiple Containers near every tower.*

Every tower starts empty. A tower with no energy is inert. To use a tower:

1. A creep with `CARRY` capacity must `withdraw` energy from a nearby container. Confirmed: every starting side has 2 workers with `3×CARRY + 6×MOVE`, and each container starts with 1000 energy.
2. That creep must `transfer` the energy into the tower.
3. The tower then either auto-fires on hostiles in range *or* requires intent calls (`tower.attack(target)` / `tower.heal(target)` / `tower.repair(target)`) — **still open, see [Open questions](#open-questions)**.

Implication: tower-charging tempo is a strategic dimension. The first side to charge their home tower has a significant defensive advantage; the first side to charge a neutral tower wins the mid-map fight around that flag. Containers are one tile from their tower, so a single worker can fully charge a tower in ~5 ticks.

## Body parts on the river

> *There are items called BodyPart that are generated sometimes in the middle of the river. When your creep steps on such an object, an additional body part gets added to its body **(with zero hits)**.*

- Spawn types confirmed in the description's icons: **R (RANGED_ATTACK), A (ATTACK), H (HEAL), M (MOVE)**. `CARRY`, `WORK`, and `TOUGH` are *not* shown as river-spawnable. (TOUGH is present on starting melee creeps but apparently can't be picked up post-hoc.) Open: whether the icons are exhaustive — see [Open questions](#open-questions).
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

## Verified from logs

The following questions, previously open, were resolved by the **Apr 2026 Test match (Test 1, vs idle System v1, 205 ticks)**. The init log line is preserved verbatim in `journal/2026-04-27.md` for posterity.

1. **CARRY in starting bodies.** ✅ Resolved: **2 workers per side**, body `3×CARRY + 6×MOVE`. Tower-charging is real and central.
2. **Starting creep mix.** ✅ Resolved: 4 ranger / 4 healer / 4 melee / 2 worker per side. Specific bodies in the table above.
3. **Map and object positions.** ✅ Resolved: see the diagram above.
4. **Container starting energy.** ✅ Resolved: 1000 each. (Whether they refill remains open.)
5. **Capture mechanic.** ✅ Resolved: stepping a creep onto a flag tile and ending the tick there captures it. v0 won by ending tick 205 on the enemy flag.

## Open questions

Still unresolved. Answered empirically as we play.

1. **Do charged towers auto-fire on hostiles in range, or do they require intent calls (`tower.attack(target)`)?** The v0 idle-opponent test does not isolate this — kills could be tower auto-fire OR rangers reaching the enemy corner. Resolve via a controlled test: charge our home tower, sit our squad on the home flag, observe whether nearby hostiles get hit without us calling any tower intent.

2. **Tower ownership transfer when a flag is captured.** When we capture a neutral flag, does its linked tower become ours? The win condition counts flags, not towers, so this is strategically separate. Add tower-ownership-by-tick to telemetry to verify.

3. **Are all body-part types actually spawnable on the river?** Icons show R/A/H/M. The description doesn't claim those are exhaustive. Log every `BodyPart` we observe across early matches.

4. **Do new (zero-hit) body parts regenerate hits?** If yes, on what cadence; if no, they're single-use. Watch a creep's body across consecutive ticks after a pickup.

5. **Container energy regeneration.** Containers start with 1000. Do they refill over time, or is that a one-time pool? Affects whether economy is sustained or one-off.

6. **Replay zip schema** on macOS. Where is the cache, what's inside, parseable how. Phase 1 work — cleanly orthogonal to gameplay.

7. **Matchmaker behaviour** — does it bias toward similar-rank opponents? Affects how much signal we get from the first 20 ranked games.

## Source

- In-app description on the Capture the Flag (Basic level, β) arena card, observed Apr 2026.
- First-tick init log from Test match against System v1 (idle), Apr 2026 — preserved in `journal/2026-04-27.md`.

This file supersedes any community write-up or 2022-era source on basic CTF mechanics — those described an earlier design that the current arena does not match.
