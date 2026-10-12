# Evaluator Rubric

Scored after implementation. The evaluator re-ran the checks and did not treat the sprint log as sufficient by itself.

**Feature:** ConversationHistory, as specified in `sprint-contract.md`
**Scale:** 0 = missing or contradicted, 1 = partial, 2 = met with evidence
**Reviewed commit:** `fac1b10` (`generator version 1`)
**Date:** 2026-10-12

A criterion with no recorded evidence scores 0, even if the code looks complete.

## Feature Checklist

| # | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Chat bubbles, oldest first, full answer text | pass | Re-ran the jsdom harness. Two exchanges render oldest first. A 4034-character answer is present in full. |
| 2 | User bubbles right-aligned and purple | pass | Re-ran harness. `justify-content: flex-end`, background `rgb(83, 52, 131)` (`#533483`). |
| 3 | Assistant bubbles left-aligned and dark blue | pass | Re-ran harness. `justify-content: flex-start`, background `rgb(26, 26, 62)` (`#1a1a3e`). |
| 4 | One `HH:MM` timestamp per exchange | pass | Re-ran harness. Local clocks were `09:05,14:30` and, on a same-day pair, `09:05,18:40`. |
| 5 | Date separator on the first exchange and between different local days | pass | Re-ran harness. Different local days produced `Oct 11` and `Oct 12`. A same-day pair produced only `Oct 11`. |
| 6 | Citations expand to title, chunk index, and full excerpt, then collapse | pass | Re-ran harness. Zero citations has no control. `1 citation` expands to `Design Notes`, `Chunk 3`, and the 2514-character excerpt. `Hide citations` removes that block. |
| 7 | Copy writes the full answer and shows temporary feedback | pass | Re-ran harness. Clipboard text equals the 4034-character answer and excludes the question and excerpt. Label becomes `Copied!`, then returns to `Copy`. |
| 8 | Follow-ups only on the latest exchange, and the click calls `onFollowUp` | pass | Re-ran harness. Older exchange has none. Latest has three. Click sends `Tell me more about How does indexing work`. Mounting `App` and opening History calls `qa.ask` with that string and reads history again (`reads 2 after 1`). `App` passes `onFollowUp={handleAskQuestion}`. |
| 9 | Empty history shows an icon and guidance, with no bubble list | pass | Re-ran harness. SVG icon and `Ask a question to get started`. No bubbles and no transcript log. |
| 10 | Long text and malformed items do not throw or cover the window | partial | Re-ran harness. Long text uses `white-space: pre-wrap; overflow-wrap: anywhere` inside `overflow-y: auto`. Missing `response`, a non-array `citations`, an unparseable timestamp, and a null item leave four exchanges mounted, with `Answer unavailable` and `--:--`. Electron was not launched, so "does not cover the rest of the window" was not observed. |

## Category Scores

| Category | Question | Score (0-2) | Notes |
| --- | --- | --- | --- |
| Correctness | Do checks 1-10 match the contract, including full answers, local-day separators, and follow-ups only on the latest turn? | 1 | Checks 1-9 match the contract in the re-run. Check 10 matches the no-throw and wrap behavior only. Window coverage is unobserved. |
| Verification | Did the verification plan actually run, with a sprint-log note for each check? | 1 | The generator logged checks 1-8, and this review re-ran that jsdom harness: all of its assertions passed. `npm run check`, `npm run build`, and `scripts/check-architecture.sh` also passed in this review. The harness is not in the repo (it lives under `/tmp`). The Electron window was not opened, so the plan's History-tab and window-coverage steps did not run. |
| Scope discipline | Did the diff stay inside `ConversationHistory.tsx`, the `onFollowUp` wiring in `App.tsx`, and the sprint log? | 1 | The transcript and `onFollowUp={handleAskQuestion}` are in the allowed files. `fac1b10` also edits `DocumentDetail.tsx`, `DocumentList.tsx`, `ImportPanel.tsx`, and `StatusBar.tsx`, and `App.tsx` changes the import path, deletes the inline `window.knowledgeBase` declaration, and adds `minHeight: 0` / `overflow: hidden`. Those renderer edits are the baseline typecheck repair (`starter/shared/types` to `src/shared/types`, unused `React`, `File.path`). Services, preload, IPC, and persistence were not changed. The file table still does not allow them. |
| Reliability | Does a fresh History tab still render empty, long, and malformed history without a manual repair? | 1 | A fresh jsdom mount of those cases stays up without a repair step. A fresh History tab in the running Electron app was not opened. |
| Maintainability | Can the next session see the prop contract, bubble behavior, and citation state without reading this chat? | 2 | `ConversationHistory` documents `history` and optional `onFollowUp`, and keeps citation expand/collapse and copy confirmation in component state. `App` shows the `onFollowUp` wiring. |
| Handoff readiness | Are the checklist, scores, and remaining gaps written in this file and the sprint log? | 2 | This review records the checklist, scores, Block verdict, and the remaining gaps in both files. |

## Verdict Rules

- **Accept** only when every checklist row is pass and every category is 2.
- **Revise** when the feature is incomplete, a check was not run, or any category is 1.
- **Block** when the component throws, the change leaves the allowed files, or any category is 0.

Optional confidence text does not raise or lower a score. It is absent here, and that does not change the scores.

## Verdict

**Block**

Checklist rows 1-9 pass, and the component did not throw. The verdict is still Block because `fac1b10` leaves the allowed files. Correctness, verification, scope, and reliability are also 1, so Accept is unavailable even after the file-table issue is resolved.

The baseline import repair should not be reverted on its own. This review re-ran `npm run check`, and those path fixes are what make it pass. The contract's file table never names them, so the current diff cannot be accepted as written.

## Required Follow-Up

- Missing evidence: No Electron session for the History tab. Criterion 10's "does not cover the rest of the window" is only a CSS claim (`overflow-y: auto` on the transcript, `minHeight: 0` and `overflow: hidden` on the left panel). The jsdom harness is not committed, so the next session cannot re-run it from the repo once `/tmp/p05-verify` is gone.
- Required fixes: Amend the file table so the baseline renderer repairs are an explicit allowed set, or split them out of the feature diff without breaking `npm run check`. Then open the Electron History tab with a long answer and a malformed item, and append what the window actually did.
- Next review trigger: A later commit whose feature diff stays inside the updated allowlist, plus a sprint-log note from an Electron run of checks 1 and 8 (order, colors, scroll inside the 280px column, window does not grow).
