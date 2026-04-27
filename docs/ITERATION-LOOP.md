# Iteration loop

How the human + Claude + harness collaborate to climb the ladder. This doc is the playbook for working *inside* this repo, not the strategy for *winning matches*.

## The premise

Most strategic decisions in this kind of game cannot be reasoned to from first principles. They are decided by ranked-match data. The repo's job is to turn that data into a tight feedback loop:

1. A clear hypothesis.
2. A minimal change to test it (one variant).
3. Tests that catch tactical regressions.
4. Enough ranked matches to get signal, not just noise.
5. A structured post-match read that says *what changed and why*.
6. Back to a hypothesis — informed by the read, not by mood.

If we don't have one of those six steps in good shape, we fix that step before pushing more bot changes.

## The roles

**Human (you).** Owns the hypothesis. Plays the ranked matches. Has the final call on whether a variant is "in" or "out." Watches replays when the metrics say something interesting. Decides when to lock in a variant as the new baseline.

**Claude.** Reads `npm run report` output and replay summaries. Proposes the next hypothesis with explicit reasoning. Implements the variant: writes new code under `variants/`, adds the corresponding tests, runs `npm test`, and pushes to a feature branch (or the working tree, if that's what you want). Does *not* speculate about strategy without data — when in doubt, asks for more matches.

**Harness.** Variant management (`runner/swap-variant.mjs`), build/push to the client (`runner/push.mjs`), replay parsing (`evaluator/parse-replay.mjs`), metric computation (`evaluator/metrics.mjs`), report rendering (`evaluator/report.mjs`).

The contract: harness handles plumbing, Claude handles synthesis, human handles judgment.

## A concrete cycle

Walking through one full iteration so the abstract loop has a concrete shape.

### Pre-cycle state

- Active variant: `v1-river-control`
- Last 10 ranked matches: 4-6 record. Two losses to flag-rush bots that reached our flag while v1 was harvesting body parts.

### 1. Read the data

```sh
npm run report
```

Output (illustrative):

```
=== last 10 matches (v1-river-control) ===
record:        4-6
avg time-to-flag (loss): 412 ticks
avg river parts captured (win):  7.2
avg river parts captured (loss): 8.1
flag-rush losses: 2 — both opponents reached our flag by tick ~500
defensive ticks (any creep within range 5 of our flag): 18% of match avg
```

### 2. Form a hypothesis

The interesting line: we're capturing *more* river parts in our losses than in our wins. The pattern is "we win the river but lose the flag." Combined with two losses to early flag-rushes, the hypothesis writes itself:

> *We're committing too many creeps to the river before we've validated the opponent isn't rushing the flag.*

Counter-hypothesis worth weighing: maybe we're losing because the river-grabs put us in bad positions, not because we have too few defenders. We can't tell from these numbers — that's a flag to watch the next set of replays for, not a reason to fork the variant.

### 3. Specify the variant

Smallest change that tests the hypothesis: hold a defensive sentry near the home flag for the first ~300 ticks, only release them to the river play once a "no-rush" condition is met (e.g. enemy squad centroid hasn't crossed the river by tick 300).

```
variants/v2-defensive-hold.mjs:
  - imports v1's plays
  - overrides commander.strategy to keep one ranger + one healer pinned
    near home flag until rush-detected becomes false
  - everything else identical
```

### 4. Tests

Add tests for the new strategy condition:
- `tests/strategy.test.mjs` — given a snapshot where enemy centroid is 70 tiles away at tick 100, `rushDetected()` returns false.
- Same with enemy centroid 30 tiles away on tick 50 → true.

### 5. Push

```sh
npm test                         # all green
npm run variant -- v2-defensive-hold
npm run push
```

### 6. Play

Play **at least 10 ranked matches** before reading the data. Anything less is noise — early swings of 6-4 vs 4-6 happen on identical bots.

### 7. Re-read

```sh
npm run report
```

Now the conversation with Claude is concrete: *here are the new numbers, here's what didn't move, here's what surprised me*. The next hypothesis comes out of that read, not out of speculation.

## Working with Claude inside this loop

Some norms that make this work and don't:

### Do
- **Hand Claude data, not vibes.** "Here's the report from the last 10 matches" >> "I feel like we're losing the flag rush."
- **Ask for the *smallest* change that tests the hypothesis.** Big variants confound results.
- **Let Claude push back on your hypothesis if the numbers don't actually support it.** That's the second-opinion value.
- **Have Claude write the new variant *and* its test in the same pass.** A variant without a test is a regression waiting to land.

### Don't
- **Don't ask for "improvements" without a hypothesis.** The bot has infinite surface area; "make it better" gets you motion without progress.
- **Don't merge a variant into baseline based on <10 matches.** Sample size matters.
- **Don't accumulate variants on top of each other without re-baselining.** When v3 wins, retire v2; the new baseline becomes v3. We don't grow a forest of half-considered variants.

## Variant lifecycle

```
hypothesis → variant file → tested → fielded ≥10 matches → outcome
                                                        ├── promotes to baseline
                                                        ├── archived (kept for reference)
                                                        └── retired (deleted from variants/)
```

We promote when the variant outperforms the baseline by a margin that exceeds the noise. We retire when the data says it's clearly worse. We archive when the result is ambiguous and we want to come back to it after other changes have moved the floor.

## When to break the loop

The loop is the default, not a religion. Break it when:

- A new arena patch lands. Re-read `docs/CTF-RULES.md`, verify what changed, and reset assumptions.
- The matchmaker behaviour visibly changes (a sudden run of much harder or much weaker opponents). Earlier data may stop being comparable.
- Multiple hypotheses are in flight at once and you can't tell what's moving the numbers. Fold back to a clean baseline and add changes one at a time.

## Open meta-questions

We don't yet have answers to these — they're things to figure out in the early phases of fielding the bot:

- **How many matches is "enough"** to call a variant better? 10 is the floor; the right answer depends on how close the win rates are. We may end up needing 20–30 for marginal changes.
- **How do we A/B without burning ranked rating?** Currently we don't — we field one variant at a time on the live ladder. If this turns out to cost us too much rating on losing experiments, we'll need a sandbox loop. (And then the lack of a headless runner becomes the bottleneck.)
- **When does the evaluator stop being enough?** At some point human replay-watching will surface tactical issues the metrics miss. Track which losses we couldn't explain from the report alone and use that as the signal to add new metrics.
