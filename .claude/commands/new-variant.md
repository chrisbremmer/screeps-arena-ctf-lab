---
description: Scaffold the next strategy variant + paired test
---

The user wants to create a new strategy variant. Arguments may include the variant name (e.g. `v1-river-control`) and a one-line hypothesis. If either is missing, ask for it before doing anything.

## What to do

1. **Confirm hypothesis.** A variant must test exactly one hypothesis. Restate it back to the user in one sentence. If the hypothesis sounds vague ("make it better", "improve combat"), refuse and ask for something specific (e.g. "kiting at range 4 instead of 3 will improve healer-survival rate").

2. **Pick the next variant number.** Look at `variants/` — variant numbers are monotonic and don't get reused. If the latest is `v3-foo`, the new one is `v4-...`.

3. **Branch from the current baseline,** not from arbitrary previous variants. Read `src/main.mjs` to see which variant is currently active; that's the branch point.

4. **Make the smallest change** that tests the hypothesis. If the change requires modifying a play / squad / micro / intel module, prefer adding a new function and having the variant call it, over mutating shared code that affects the baseline.

5. **Add a test.** New tactical primitives need a test in `tests/<name>.test.mjs`. Don't skip this — the rule is enforced.

6. **Run the test suite.** `npm test`. Don't proceed if anything fails.

7. **Don't swap the active variant.** That's the user's decision — they may want to inspect the diff first. Just confirm the variant exists and tests pass.

## Output

After scaffolding, return:

- Variant name and path.
- One-sentence hypothesis (echoed back).
- Files touched.
- Test result (pass count).
- The exact commands the user runs next: `npm run variant -- <name>` and `npm run push`.

Nothing more. The user is iterating fast; trim the prose.

## What not to do

- Don't field the variant by editing `src/main.mjs` to point at it. Manual swap.
- Don't commit. Variant changes get reviewed before commit.
- Don't propose follow-up variants in the same response. One hypothesis at a time.
