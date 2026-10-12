# Evaluator Rubric

Score this only after implementation. The planner left every score blank on purpose.

**Feature:** ConversationHistory, as specified in `sprint-contract.md`
**Scale:** 0 = missing or contradicted, 1 = partial, 2 = met with evidence

A criterion with no recorded evidence scores 0, even if the code looks complete.

## Feature Checklist

Mark each acceptance criterion before scoring the categories below.

| # | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Chat bubbles, oldest first, full answer text | | |
| 2 | User bubbles right-aligned and purple | | |
| 3 | Assistant bubbles left-aligned and dark blue | | |
| 4 | One `HH:MM` timestamp per exchange | | |
| 5 | Date separator on the first exchange and between different local days | | |
| 6 | Citations expand to title, chunk index, and full excerpt, then collapse | | |
| 7 | Copy writes the full answer and shows temporary feedback | | |
| 8 | Follow-ups only on the latest exchange, and the click calls `onFollowUp` | | |
| 9 | Empty history shows an icon and guidance, with no bubble list | | |
| 10 | Long text and malformed items do not throw or cover the window | | |

## Category Scores

| Category | Question | Score (0-2) | Notes |
| --- | --- | --- | --- |
| Correctness | Do checks 1-10 match the contract, including full answers, local-day separators, and follow-ups only on the latest turn? | | |
| Verification | Did the verification plan actually run, with a sprint-log note for each check? | | |
| Scope discipline | Did the diff stay inside `ConversationHistory.tsx`, the `onFollowUp` wiring in `App.tsx`, and the sprint log? | | |
| Reliability | Does a fresh History tab still render empty, long, and malformed history without a manual repair? | | |
| Maintainability | Can the next session see the prop contract, bubble behavior, and citation state without reading this chat? | | |
| Handoff readiness | Are the checklist, scores, and remaining gaps written in this file and the sprint log? | | |

## Verdict Rules

- **Accept** only when every checklist row is pass and every category is 2.
- **Revise** when the feature is incomplete, a check was not run, or any category is 1.
- **Block** when the component throws, the change leaves the allowed files, or any category is 0.

Optional confidence text does not raise or lower a score.

## Verdict

- Accept
- Revise
- Block

## Required Follow-Up

- Missing evidence:
- Required fixes:
- Next review trigger:
