# Evaluator Rubric

Third review, after generator revision `0268bf5`. The evaluator re-ran the checks and did not treat the sprint log as sufficient by itself.

**Feature:** ConversationHistory, as specified in `sprint-contract.md`
**Scale:** 0 = missing or contradicted, 1 = partial, 2 = met with evidence
**Reviewed commits:** `fac1b10` (implementation), `4eb24e5` (revision), `0268bf5` (revision 2)
**Date:** 2026-10-12

The first review Blocked `fac1b10` for the file table and the unobserved window. The second review Accepted `4eb24e5` after an Electron scroll measurement, and noted that citations, copy, follow-ups, the same-day separator, and the empty History tab had not been clicked in that window. This review scores those clicks.

A criterion with no recorded evidence scores 0, even if the code looks complete.

## Feature Checklist

| # | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Chat bubbles, oldest first, full answer text | pass | Electron History tab. This review's seed rendered `Same morning`, `Same evening`, `How does indexing work?` oldest first. After the follow-up click, a fourth user bubble appeared with that suggestion text. The earlier long-answer window still showed `LONG-ANSWER-START` through `LONG-ANSWER-END`. |
| 2 | User bubbles right-aligned and purple | pass | Prior Electron computed style: `justify-content: flex-end`, background `rgb(83, 52, 131)`. Screenshot in this review shows the same right-aligned purple bubbles. Component unchanged. |
| 3 | Assistant bubbles left-aligned and dark blue | pass | Prior Electron computed style: `justify-content: flex-start`, background `rgb(26, 26, 62)`. Screenshot in this review shows the same left-aligned dark bubbles. Component unchanged. |
| 4 | One `HH:MM` timestamp per exchange | pass | This Electron window: `09:05`, `18:40`, `14:30` for the Oct 11 morning, Oct 11 evening, and Oct 12 exchange. |
| 5 | Date separator on the first exchange and between different local days | pass | This Electron window showed only `Oct 11` and `Oct 12`. The two Oct 11 exchanges did not get a second separator. |
| 6 | Citations expand to title, chunk index, and full excerpt, then collapse | pass | This Electron window. Morning and latest answers had no citation control. The evening answer showed `1 citation` and the list was closed. Clicking it showed `Design Notes`, `Chunk 3`, and `EXCERPT-START full citation excerpt must stay intact EXCERPT-END`, with the control reading `Hide citations`. Clicking again removed the excerpt block. |
| 7 | Copy writes the full answer and shows temporary feedback | pass | This Electron window. Copy on the morning bubble wrote `Morning answer that must stay complete` to the clipboard. The label became `Copied!` and returned to `Copy` on its own. |
| 8 | Follow-ups only on the latest exchange, and the click calls `onFollowUp` | pass | This Electron window. Counts were `0, 0, 3`. Clicking `Tell me more about How does indexing work` wrote that exact question into `qa-history.json` and stored the indexing answer from `QaService`. The window then showed four user bubbles, follow-ups only on the new latest exchange (`0, 0, 0, 3`), and the same new answer on the right-hand card. |
| 9 | Empty history shows an icon and guidance, with no bubble list | pass | A second fresh Electron window with an empty history file showed History (0), the chat icon, and `No conversation yet. Ask a question to get started.` Bubble count was 0 and the transcript log was absent. |
| 10 | Long text and malformed items do not throw or cover the window | pass | Prior Electron re-measure, component unchanged: transcript 663/4258 inside a 280px column, long bubble right edge at x=252, right pane still visible, content 1200 by 772. Four exchanges stayed mounted, including `Answer unavailable` and `--:--`. |

## Category Scores

| Category | Question | Score (0-2) | Notes |
| --- | --- | --- | --- |
| Correctness | Do checks 1-10 match the contract, including full answers, local-day separators, and follow-ups only on the latest turn? | 2 | Same-day separator, citation toggle, copy, follow-up ask path, and empty History were clicked in Electron this review. Scroll and window coverage remain the prior Electron measurement. |
| Verification | Did the verification plan actually run, with a sprint-log note for each check? | 2 | Revision 2 logs checks 2-7 and 9 in the BrowserWindow. This review re-launched that Electron script and got the same report. Checks 1, 8, and 10 remain the earlier Electron run. No product source changed in `0268bf5`. The scripts are still outside the repo. |
| Scope discipline | Did the diff stay inside the updated file table? | 2 | `0268bf5` only appends the sprint log in `sprint-contract.md`. `ConversationHistory.tsx`, the `onFollowUp` wiring, and the history file format are unchanged. |
| Reliability | Does a fresh History tab still render empty, long, and malformed history without a manual repair? | 2 | A fresh Electron window with an empty history file rendered the icon and guidance. The earlier fresh window rendered the long answer and malformed rows. Neither needed a repair step. |
| Maintainability | Can the next session see the prop contract, bubble behavior, and citation state without reading this chat? | 2 | `ConversationHistory` documents `history` and optional `onFollowUp`, and keeps citation expand/collapse and copy confirmation in component state. `App` shows the `onFollowUp` wiring. |
| Handoff readiness | Are the checklist, scores, and remaining gaps written in this file and the sprint log? | 2 | This review keeps the Accept verdict and records the Electron clicks that the second review had left as jsdom-only. |

## Verdict Rules

- **Accept** only when every checklist row is pass and every category is 2.
- **Revise** when the feature is incomplete, a check was not run, or any category is 1.
- **Block** when the component throws, the change leaves the allowed files, or any category is 0.

Optional confidence text does not raise or lower a score. It is absent here, and that does not change the scores.

## Verdict

**Accept**

Every checklist row passes, and every category is 2. Revision `0268bf5` does not change the product. It supplies the Electron clicks the previous Accept had marked as not yet done in the window, and this review reproduced them.

## Required Follow-Up

- Missing evidence: The check scripts are still outside the repo. The behavior they measure was reproduced in this review.
- Required fixes: None for this sprint.
- Next review trigger: Re-open only if a later commit changes `ConversationHistory.tsx`, the `onFollowUp` wiring, or the history file format.
