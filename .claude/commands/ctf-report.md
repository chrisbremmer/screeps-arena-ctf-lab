---
description: Synthesize recent journal entries and propose the next hypothesis
---

The user wants a structured read on recent ranked matches and a single proposed next move. This is the synthesis step in the iteration loop (`docs/ITERATION-LOOP.md`).

## What to do

1. **Read the latest journal entries.** Files under `journal/`. Default scope: the most recent two days, or whatever the user specifies.

2. **If <10 matches in the data,** stop and tell the user. Smaller samples are noise. Don't propose a hypothesis off 3 matches.

3. **Compute the obvious aggregates yourself:**
   - W-L-D record per variant in the data.
   - Pattern of losses (what got mentioned multiple times — flag rushes, getting kited, healer dying first, etc.).
   - Anything that contradicts the active variant's design intent.

4. **Identify ONE high-leverage hypothesis.** Not three. The cost of testing is 10+ ranked matches; we can only afford to test one thing at a time.

5. **Write the report.** Format:

   ```
   === report: <variant> over <date range> ===

   Record: W-L-D
   Sample size: N matches
   Confidence: <low/medium/high — based on N and result variance>

   What we learned:
   - <one bullet per real observation>

   What didn't move:
   - <one bullet per metric/behaviour that stayed flat>

   Hypothesis for next variant:
   <one sentence>

   Why this hypothesis (not others):
   <one paragraph — what evidence points here>

   Smallest change to test it:
   <pointer to the file/function and what to modify, ~3 lines>

   Risks / how this could be wrong:
   <one paragraph — what would falsify the read>

   Suggested variant name: vN-<short-description>
   ```

6. **Don't scaffold the variant yet.** That's `/new-variant`'s job. Wait for the user to greenlight the hypothesis.

## What not to do

- Don't propose multiple hypotheses. Pick one. If you genuinely can't decide, say so and ask the user which to test.
- Don't propose hypotheses that contradict `docs/PLAYBOOK.md` without flagging the contradiction explicitly.
- Don't speculate beyond the data. "We may be losing because..." is fine; "We are losing because..." needs evidence.
- Don't compute fake metrics. If the journal entries don't have the data, say "we'd need to log X to know."
