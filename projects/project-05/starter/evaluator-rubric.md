# Evaluator Rubric

Second review, after generator revision `4eb24e5`. The evaluator re-ran the checks and did not treat the sprint log as sufficient by itself.

**Feature:** ConversationHistory, as specified in `sprint-contract.md`
**Scale:** 0 = missing or contradicted, 1 = partial, 2 = met with evidence
**Reviewed commits:** `fac1b10` (implementation), `4eb24e5` (revision)
**Date:** 2026-10-12

The first review Blocked `fac1b10`: checklist 1-9 passed in jsdom, criterion 10 had no Electron observation, and the diff left the file table. This review scores the revision against the updated file table.

A criterion with no recorded evidence scores 0, even if the code looks complete.

## Feature Checklist

| # | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Chat bubbles, oldest first, full answer text | pass | Electron History tab, re-measured this review. Order: `Older question`, `How does indexing work?`, `Missing response`, `Bad clock`. The long answer includes both `LONG-ANSWER-START` and `LONG-ANSWER-END`. Screenshot shows the full bubble text wrapping in the column. |
| 2 | User bubbles right-aligned and purple | pass | Electron computed style: `justify-content: flex-end`, background `rgb(83, 52, 131)`. Screenshot matches. |
| 3 | Assistant bubbles left-aligned and dark blue | pass | Electron computed style: `justify-content: flex-start`, background `rgb(26, 26, 62)`. Screenshot matches. |
| 4 | One `HH:MM` timestamp per exchange | pass | Electron clocks: `09:05`, `14:30`, `--:--`, `--:--`. The same-day pair `09:05,18:40` was already reproduced in the jsdom harness; `ConversationHistory.tsx` has not changed since that run. |
| 5 | Date separator on the first exchange and between different local days | pass | Electron separators: `Oct 11`, `Oct 12`. The same-day case, only `Oct 11`, was reproduced in the earlier jsdom re-run. The component has not changed since. |
| 6 | Citations expand to title, chunk index, and full excerpt, then collapse | pass | Prior jsdom re-run: zero citations has no control; `1 citation` expands to `Design Notes`, `Chunk 3`, and the full excerpt; `Hide citations` removes it. Component unchanged since. This Electron seed did not click the control. |
| 7 | Copy writes the full answer and shows temporary feedback | pass | Prior jsdom re-run: clipboard equals the full answer, excludes the question and excerpt, label goes `Copied!` then back to `Copy`. Component unchanged since. Not clicked in this Electron window. |
| 8 | Follow-ups only on the latest exchange, and the click calls `onFollowUp` | pass | Prior jsdom re-run: older exchange has none; latest click calls `onFollowUp` and `App` routes it through `qa.ask` then refreshes history. `App` still passes `onFollowUp={handleAskQuestion}`. Not clicked in this Electron window. |
| 9 | Empty history shows an icon and guidance, with no bubble list | pass | Prior jsdom re-run: SVG icon, `Ask a question to get started`, no bubbles. Component unchanged since. This Electron seed had four items, so the empty tab was not opened. |
| 10 | Long text and malformed items do not throw or cover the window | pass | Electron re-measure: transcript client height 663, scroll height 4258, so the long answer scrolls. Left column width 280; the long bubble's right edge is x=252. The right pane starts at x=280 and stays visible, including the ask box. Root height and `body.scrollHeight` are 772, equal to `window.innerHeight`. Four exchanges stay mounted. Missing response shows `Answer unavailable`. Bad timestamp shows `Shown anyway` and `--:--`. |

## Category Scores

| Category | Question | Score (0-2) | Notes |
| --- | --- | --- | --- |
| Correctness | Do checks 1-10 match the contract, including full answers, local-day separators, and follow-ups only on the latest turn? | 2 | Checks 1-3 and 10 were observed in the Electron History tab this review. Checks 4-9 still match the earlier jsdom re-run, and the component has not changed. |
| Verification | Did the verification plan actually run, with a sprint-log note for each check? | 2 | Generation log notes checks 1-8 from jsdom. Revision log notes the Electron History tab. This review re-launched Electron with the seeded history and got the same measurements: column 280, scroll 663/4258, content 1200 by 772, window not grown. `npm run check`, `npm run build`, and `scripts/check-architecture.sh` passed in the first review; no source file changed after that. The jsdom and Electron scripts are still outside the repo. |
| Scope discipline | Did the diff stay inside the updated file table? | 2 | `4eb24e5` only edits `sprint-contract.md`. The code diff since planning is `ConversationHistory.tsx`, the named `App.tsx` edits, and the four baseline renderer repairs now listed in the file table. Services, preload, IPC, and persistence were not changed. `evaluator-rubric.md` is this review's score sheet. |
| Reliability | Does a fresh History tab still render empty, long, and malformed history without a manual repair? | 2 | A fresh Electron window, with history seeded only in its user-data directory, opened History and rendered the long answer and the malformed rows without a repair step. Empty history remains the earlier fresh jsdom mount of the same component. |
| Maintainability | Can the next session see the prop contract, bubble behavior, and citation state without reading this chat? | 2 | `ConversationHistory` documents `history` and optional `onFollowUp`, and keeps citation expand/collapse and copy confirmation in component state. `App` shows the `onFollowUp` wiring. |
| Handoff readiness | Are the checklist, scores, and remaining gaps written in this file and the sprint log? | 2 | This review replaces the Block scores and records the Accept verdict in both files. |

## Verdict Rules

- **Accept** only when every checklist row is pass and every category is 2.
- **Revise** when the feature is incomplete, a check was not run, or any category is 1.
- **Block** when the component throws, the change leaves the allowed files, or any category is 0.

Optional confidence text does not raise or lower a score. It is absent here, and that does not change the scores.

## Verdict

**Accept**

Every checklist row passes, and every category is 2. The first Block is cleared: the file table now names the baseline renderer repairs, and an Electron History tab shows the long transcript scrolling inside the 280px column without growing the window. This review reproduced those measurements rather than taking the revision log on its own.

## Required Follow-Up

- Missing evidence: Citations, copy, follow-ups, the same-day separator, and the empty History tab were not clicked again in this Electron window. They remain covered by the jsdom re-run, and `ConversationHistory.tsx` is unchanged since that run. The check scripts are not committed.
- Required fixes: None for this sprint.
- Next review trigger: Re-open only if a later commit changes `ConversationHistory.tsx`, the `onFollowUp` wiring, or the history file format.
