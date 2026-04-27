# Variants

A variant is a self-contained strategy module. Exactly one variant is "active" at a time — `src/main.mjs` re-exports it; `runner/swap-variant.mjs` rewrites that re-export.

## Why files instead of feature flags

- **Diffability.** Comparing two variants side by side is the cleanest representation of a strategic experiment.
- **No flag rot.** Boolean flags inside the bot accumulate, get stale, and pollute the read of "what is this bot doing right now."
- **Reproducibility.** A variant filename pins the strategy at a moment in time. Any past variant can be resurrected by name.

## Naming

`vN-short-description.mjs`, where `N` increments with each fielded experiment. Examples:

- `v0-baseline.mjs`
- `v1-river-control.mjs`
- `v2-defensive-hold.mjs`
- `v3-strategy-detection.mjs`

The number is monotonic, not branched. If a variant is retired, its number is not reused.

## Anatomy

A variant is a thin orchestration shim. It imports the layers it needs and exports `loop()`:

```js
import { tickV0 } from "../src/commander/commander.mjs";

export function loop() {
  tickV0();
}
```

A variant is allowed to:

- Import any layer below the commander.
- Override which plays the commander assigns by passing different play modules.
- Adjust per-tick parameters (e.g. cohesion radius, kite range) via commander options.

A variant is **not** allowed to:

- Re-implement the commander. If a variant needs commander logic that doesn't exist, the commander grows a knob — the variant doesn't fork it.
- Mutate `src/` files. All variant differences live in this directory.

## Lifecycle

```
proposed → fielded (≥10 ranked matches) → outcome
                                         ├── promotes to baseline
                                         ├── archived (kept for reference)
                                         └── retired (deleted)
```

Promote when the variant outperforms the baseline by a margin that exceeds noise. Retire when the data says it's clearly worse. Archive when ambiguous and worth revisiting after other changes have moved the floor.

## Adding a variant

1. Copy the file of the variant you're branching from.
2. Rename to the next `vN-...` slot.
3. Make the smallest change that tests one hypothesis.
4. Add a test under `tests/` for any new tactical primitive the variant introduces.
5. `npm test`
6. `npm run variant -- vN-...` to make it active.
7. `npm run push` to ship to the Arena client.
8. Play ≥10 ranked matches, then `npm run report`.
