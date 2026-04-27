# Tactical playbook

Concrete tactics, with rationale and counter-plays. This is where we accumulate the *meta knowledge* that doesn't belong in code comments — the "why we do it this way" notes that survive across variants.

## Format

Each entry is:

> **Tactic.** What the bot does.
> **Why.** The mechanic or matchup it exploits.
> **Counter.** What beats it, so we know what to watch for.
> **Status.** `theorized` (no data yet), `tested` (has match evidence), `meta` (currently active in baseline).

## Economy and tower control

### Charge home tower as priority 1
**Tactic.** Any creep with `CARRY` capacity ferries energy from the home container to the home tower until the tower is at capacity, before contributing to combat.
**Why.** A charged home tower changes a flag-rush from "trivial loss" to "trivial defense." It's the highest-leverage early action available — assuming we have any creep with `CARRY`.
**Counter.** Pressure the ferrying creep with a single ranger early. The ferry is high-value, low-HP, and predictable.
**Status.** theorized — gated on confirming `CARRY` exists in starting bodies.

### Contest the closer neutral tower over the farther one
**Tactic.** When committing to a neutral flag, pick the one with shorter expected travel for the contesting squad. Don't split between both unless we have squad-strength to spare.
**Why.** The flag-count win condition rewards holding ≥3 of 4. Holding 1 home + 1 neutral = 2, which is the draw floor. Holding 2 neutrals + home = 3, which is the win floor against any opponent who hasn't captured anything else.
**Counter.** Race us to the same neutral, force a fight before either side has tower coverage. Whoever wins the firefight wins the flag.
**Status.** theorized.

### Don't bother charging a neutral tower until we own its flag
**Tactic.** Charge-tower play only targets towers whose linked flag we currently own.
**Why.** A captured tower's energy benefits whoever owns the flag. Charging a tower we don't own gives the enemy a free defensive bonus.
**Counter.** None — this is just correct play.
**Status.** theorized — needs confirmation that captured-flag transfers tower control.

## Flag dynamics

### Always hold ≥2 flags after tick 1500
**Tactic.** As tick 1500 approaches, if we hold 2+ flags, prioritize defending them over capturing more.
**Why.** Tick-out tie-break is flag count. Holding 2 flags is a guaranteed non-loss; risking one to capture a third can convert a draw into a loss if the trade fails.
**Counter.** Force us into a fight near a flag we hold; if we engage we may lose the defender. Counter-counter: tower coverage means engagements near our flag are heavily one-sided.
**Status.** theorized.

### Capture-the-tile semantics (verify in-client)
**Tactic.** Path planning treats the flag tile itself as the destination, not adjacent tiles. The capturing creep ends its tick on the flag.
**Why.** The mechanic is "step on the flag." Adjacent isn't capture.
**Counter.** Block the flag tile with an enemy creep; we can't capture if the tile is occupied. (Also one of our open questions — see CTF-RULES.md.)
**Status.** theorized — depends on whether the game tolerates ending a tick on a flag tile when adjacent enemies are present.

### Sentry on every flag we own
**Tactic.** A single defender (ideally a healer with tower coverage) holds within range 1 of each flag we own.
**Why.** Capture is a single-creep action — one sneaky enemy creep is enough. A sentry that survives one ranged hit and gets healed by the tower stops the cheese.
**Counter.** Coordinate two captures across two flags simultaneously; we can't sentry everywhere with our limited starting force.
**Status.** theorized.

## Movement & positioning

### Centroid pathing
**Tactic.** Move the squad toward a target by computing the squad's centroid, picking a path from centroid → target, and asking each member to step toward the next path tile while staying in cohesion radius (default: 3).
**Why.** Ranger and healer are both range-3 effective. A squad that drifts apart breaks heal coverage. A squad that paths individually has a long tail — the rear loses the front to rangers.
**Counter.** A faster squad can dictate engagement range; cohesion does nothing if you're always being kited. Counter-counter: pick fights, don't accept them.
**Status.** theorized.

### Don't kite out of healer range
**Tactic.** Ranger kite logic refuses to step backward if it would exit healer range.
**Why.** Naive kiting maximizes ranger survival in isolation but kills the squad. The squad is the unit, not the creep.
**Counter.** Force-engage by sending a melee creep into the healer instead of the ranger; the ranger has to choose between fleeing and abandoning the healer.
**Status.** theorized.

### Swamp-aware pathing on the river
**Tactic.** When traversing the river, prefer paths that minimize swamp tile count even if longer in absolute distance.
**Why.** Swamp is 5× the move cost of plain. A two-tile-longer plain detour beats a swamp shortcut on fatigue.
**Counter.** None at the strategic level — this is just correct pathfinding.
**Status.** theorized.

## Body growth

### Grow the squad's bottleneck, not the closest pickup
**Tactic.** Body-part grab decisions are scored by *what the squad lacks*, not by proximity. If the squad is healer-bottlenecked (too many rangers per healer), prefer `HEAL` parts even at extra travel cost.
**Why.** River parts compound — a marginal addition to a strong creep is less valuable than a needed addition to a weak one.
**Counter.** Force tempo such that we can't afford the detour. If we're already losing the flag race, "the right pickup" is moot.
**Status.** theorized.

### Match every role part with a `MOVE`
**Tactic.** Refuse to grab a role part if the creep already has more role parts than `MOVE` parts, unless a `MOVE` is also available within N tiles.
**Why.** Fatigue compounds; an over-fattened ranger drops out of squad cohesion permanently.
**Counter.** Spawn body parts to selectively bait us. (Probably not actually a thing the game does, but worth thinking about.)
**Status.** theorized.

### Don't fight the opponent for parts on their side
**Tactic.** Body-part collection is bounded to the river midline + a small buffer. We don't enter their half to contest a part.
**Why.** A part you might pick up isn't worth a creep you'll lose.
**Counter.** If the opponent disagrees and contests our half, we get free engagements on our turf.
**Status.** theorized.

## Combat

### Focus-fire the lowest effective HP
**Tactic.** Squad target priority is `enemy.hits / enemy.hitsMax` ascending, with a tiebreaker on threat-DPS (highest first).
**Why.** Removed creeps stop dealing damage immediately. Damage spread across many enemies is wasted.
**Counter.** Healers in the enemy squad — focusing one creep means the others heal them through. Counter-counter: prioritize their healers (next entry).
**Status.** theorized.

### Healer priority on ranged engagement
**Tactic.** When in range of multiple enemies, rangers prefer the lowest-HP enemy *healer* over equally-low-HP non-healers.
**Why.** Removing a healer collapses the enemy heal economy permanently. Removing a ranger costs them DPS but they recover.
**Counter.** Stack healers far back and out of range. Forces us to commit forward to reach them, exposing our own healers.
**Status.** theorized.

### `rangedMassAttack` when surrounded by ≥3 enemies in range 1
**Tactic.** Switch from single-target `rangedAttack` to `rangedMassAttack` when ≥3 enemies are at range 1.
**Why.** Mass attack is per-target damage × N, no falloff penalty at range 1. Single-target wastes the AoE potential.
**Counter.** Don't surround with rangers — engage with melee that don't trigger the heuristic.
**Status.** theorized.

### Melee creeps as pressure, not solo attackers
**Tactic.** Melee never engages alone. They advance behind the rangers and only commit when an enemy is within range 1 of an already-engaged target.
**Why.** Melee in isolation gets kited and dies. Melee on top of a ranger fight forces the enemy ranger to choose between firing at the melee (and dying to ours) or the existing target.
**Counter.** Block the melee out of position via terrain or a sacrificial enemy creep.
**Status.** theorized.

## Flag dynamics

### Detect rushes by tick 300 enemy centroid
**Tactic.** If the enemy squad's centroid has crossed the river by tick 300, classify the match as "rush" and recall river-control creeps to defensive positioning.
**Why.** River control is ahead-on-tempo; flag race is ahead-on-distance. If they're racing, we don't have time to grow.
**Counter.** Fake rushes — push to the river then retreat. Forces us to over-react.
**Status.** theorized.

### Flag carrier = whoever is closest with the cleanest path
**Tactic.** When a squad is committed to capturing a flag (any non-our flag), the designated carrier is the surviving member with the lowest path cost to the flag tile, regardless of role. The rest of the squad covers them.
**Why.** Role doesn't matter for capture — only ending a tick on the tile does. Healers on the flag tile work fine.
**Counter.** Block the flag tile with an enemy creep; we can't capture if the tile is occupied. (Confirm in-client.)
**Status.** theorized.

## Strategy detection

### Read enemy composition on tick 1
**Tactic.** Before any moves, count enemy creeps by role part. Classify as ranged-heavy (>50% ranged), melee-heavy (>50% attack), balanced, or healer-heavy.
**Why.** Counter-play depends on the read. Against ranged-heavy: cohesion + close the distance. Against melee-heavy: kite at range 3. Against healer-heavy: focus their healers first.
**Counter.** Mirror compositions early then transform via the river. The read becomes obsolete by tick 500.
**Status.** theorized — the *detection* is implementable now; the counter-plays are gated on Phase 3.

## Anti-tactics (things we tried/considered and rejected)

This section grows as we learn. Initial entries:

### Sending creeps individually toward the flag
**Why we considered it.** Spreading the squad means the enemy can't focus-fire effectively.
**Why we rejected it.** Every individual creep loses to a clustered enemy squad with healing. Spread-out is only good if all your creeps are individually strong, which is the opposite of the early-game state.

### Aggressively contesting parts on the enemy side of the river
**Why we considered it.** Denying parts to the opponent is theoretically as valuable as gaining them.
**Why we rejected it.** Travel time + exposure cost > expected denial value. The math only works if we're already winning, in which case we don't need it.
