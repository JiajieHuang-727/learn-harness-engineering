# Quality Document -- Project 06 Capstone

## Scoring Summary

Cleanup pass, 2026-10-15. Dead code removed, docs aligned to this tree, and the import / index / question / delete paths fixed. `npm run check` and `npm run build` pass. A service script checked import, single-document index, the fixed question, and delete. The Electron window was not driven again, so the baseline UI record is unchanged.

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Build & Compile | A | `npm run check` and `npm run build` pass. Renderer imports resolve to `src/shared/types.ts`. Unused `React` imports and the unused `Chunk` import are gone |
| Feature Completeness | C | Import, index, cited Q&A, delete, and status now have one path each. Feedback, in-app reset, tests, and benchmark scripts are still absent. The window was not re-run |
| ConversationHistory | C | Flat list of question, answer, citation count, confidence, and timestamp. Clear History calls `qa.clearHistory`. No chat bubbles and no feedback |
| Structured Logging | B | Import, index, and ask still log JSON. Read handlers now log at DEBUG. A live `npm run dev` terminal was not captured |
| Q&A with Citations | B | Service check: fixed indexing question, confidence 0.85, `citationCount` 2, both titles `Retrieval Plan`, answer mentions paragraph boundaries and 500 characters. Not re-checked in the window |
| Document Import | B | Service check: title `Retrieval Plan`, `.json` rejected, `meeting-summary.txt` keeps the filename stem. The Import button calls `documents.import()` and the main process opens the native dialog. The dialog was not clicked |
| Indexing | B | Service check: `status` `indexed`, 5 non-empty chunks, `index-meta.json` written. The detail view reloads chunks when status or chunk count changes. Not re-checked in the window |
| Persistence | B | Delete removes the content file, chunk file, and index entry. Restart was not re-run |
| Test Coverage | F | No test files. The check above was a one-off Node script against `dist/services` |
| Documentation | B | `docs/`, `CLAUDE.md`, `AGENTS.md`, `feature_list.json`, `init.sh`, the checklist, and the rubric describe this tree. They no longer claim 14 channels, feedback, reset, or the missing scripts |
| Clean State | C | No Reset button. The unused `resetAll` method was removed. The documented clean start is deleting the data directory from the startup log |
| Benchmarking | F | No `scripts/benchmark.sh`. `benchmark-tasks.md` is the manual set and was not re-run |

## Overall Grade: C

## Grade Movement (baseline → this cleanup)

| Dimension | Baseline | Now | Why |
|-----------|----------|-----|-----|
| Build & Compile | C | A | Type check passes |
| Documentation | C | B | Harness docs match the code |
| Q&A with Citations | D | B | Pattern choice uses the most keyword hits, and citations read `index-meta.json` after a single-document index |
| Document Import | C | B | Heading title, type and size checks, dialog wired from the Import button |
| Indexing | C | B | Single-document path writes index metadata and `indexed` |
| Feature Completeness | D | C | Those paths are connected. Feedback, reset, and scripts are still missing |
| ConversationHistory | D | C | Still a flat list, now described as a flat list |
| Clean State | D | C | The false reset claim is gone. Emptying data is a directory delete |
| Structured Logging | B | B | Read handlers log. No new live capture |
| Persistence | B | B | Delete cleanup added. Restart not re-run |
| Test Coverage | F | F | Still no tests |
| Benchmarking | F | F | Still no benchmark script |

## What Changed

- Deleted `ImportPanel.tsx`, `ConversationMessage`, `conversation:get`, `app:status`, `logger.forService`, and unused persistence methods including `resetAll`.
- `IndexingService` takes the `DocumentService` and updates status through it. `QaService` takes that indexer and does not construct another one.
- The 100–500 ms sleep in `ask` is gone.
- `feature_list.json` marks feedback, in-app reset, benchmark scripts, and the cleanup scanner as `fail`.

## Critical Gaps

1. The five tasks in `benchmark-tasks.md` have not been clicked through the window since this change.
2. No feedback control.
3. No in-app reset.
4. No automated tests and no `scripts/benchmark.sh`.

## Action Items

- [x] Fix renderer imports so `npm run check` passes
- [x] Wire Import to a file dialog and use the Markdown heading as the title
- [x] On single-document indexing, write `index-meta.json`, set status to `indexed`, and refresh the chunk list
- [x] Return a cited answer at 0.85 for the fixed indexing question
- [x] Return `AppStatus` from `indexing:status`
- [x] Delete the document's content, chunks, and index entry
- [x] Rewrite the harness docs to match this tree
- [ ] Re-run `benchmark-tasks.md` in the window
- [ ] Add feedback on Q&A responses
- [ ] Add an in-app clean-state reset if the product should have one
- [ ] Add tests and, separately, a benchmark script if timing should be automated
