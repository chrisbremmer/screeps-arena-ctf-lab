---
description: Record the outcome of a recent batch of ranked matches into journal/
---

The user just played some ranked matches and wants to capture what happened. The fast path is `pbpaste | npm run report -- --journal --opponent "<name>"` per match, which auto-extracts a structured entry. Use that whenever the user has a console paste.

This skill exists for the cases where:
- The user only has a written summary (didn't grab the console).
- Multiple matches need batched into one note.
- The auto-parser missed something the user wants to flag manually.

## What to do

1. **Ask for the outcomes** if not provided in arguments. Minimum data per match:
   - Result: W / L / D
   - Match length (in ticks if known, or rough)
   - One sentence on what happened (especially for losses)
   - Variant in play (default: read `src/main.mjs` to see what's active)

2. **Don't infer.** If the user says "we lost a flag rush" but didn't say which flag, ask. Bad data is worse than no data here.

3. **Append to `journal/YYYY-MM-DD.md`** (today's date). Create the directory and file if missing. Format each match as:

   ```
   ## Match N — <variant> — <W/L/D>

   **Length:** ~XXXX ticks
   **Notes:** <user's sentence>
   **Surprises / open questions:** <anything to flag>
   ```

4. **Aggregate at the bottom of the day's file** — running W-L-D for the active variant.

## Output

After writing, return a one-line summary: `recorded N matches → journal/YYYY-MM-DD.md (variant vN-...: W-L-D)`. Don't echo back what was just written.

## What not to do

- Don't propose hypotheses or new variants. That's `/ctf-report`'s job.
- Don't commit the journal entry. Journal commits happen at logical breakpoints, not after every batch.
- Don't write speculation as if it were observation. If the user said "I think they were rushing," log it as `(observed)` or `(my read)` — not as fact.
