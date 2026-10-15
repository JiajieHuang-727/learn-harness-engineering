# Quality Document -- Project 06 Capstone

## Scoring Summary

Window re-run of `benchmark-tasks.md` on 2026-10-15, after the cleanup. Full evidence is in `cleanup-benchmark-record.md`. The baseline window record stays in `baseline-benchmark-record.md`.

| | Baseline window | This window |
|--|-----------------|-------------|
| Completion (pass or pass-with-defect) | 4/5 | 5/5 |
| Strict pass | 1/5 | 4/5 |
| Retries | 4 | 1 |
| Defects | 4 | 1 |

T2, T3, and T5 moved from defect or fail to pass. T4 stayed a pass. T1 is still pass-with-defect: the specified file was imported with the console call.

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Build & Compile | A | `npm run check` and `npm run build` pass. Renderer imports resolve to `src/shared/types.ts` |
| Feature Completeness | C | Import, index, cited Q&A, history, and restart each have one working path. Feedback, in-app reset, tests, and benchmark scripts are absent |
| ConversationHistory | C | After restart, Show History showed the fixed question, the answer, `2 citation(s)`, `Confidence: 85%`, and the timestamp. Flat list. No chat bubbles and no feedback |
| Structured Logging | A | The scored terminal has JSON for import, index, and ask. Each line has timestamp, level, service, and message. `Answer generated` includes `confidence` 0.85 and `citationCount` 2 |
| Q&A with Citations | A | One submit of the fixed question. Answer mentions paragraph boundaries and about 500 characters. Two citations titled `Retrieval Plan`. Confidence 85% |
| Document Import | B | The window title is `Retrieval Plan` and the size is 1.9 KB. The Import button opens the native dialog. The scored file was imported with `documents.import(absolutePath)` after the picker did not leave that file in the list |
| Indexing | A | `Status: indexed`, the list shows `Indexed`, and Chunk 0–4 are non-empty. Chunk 1 contains the paragraph-boundary and ~500 character lines. The chunk list updated without leaving the detail pane |
| Persistence | A | Quit and relaunch kept `Retrieval Plan` as indexed, with 5 chunks and the T3 history entry. No re-import and no re-index |
| Test Coverage | F | No test files |
| Documentation | B | `docs/`, `CLAUDE.md`, `AGENTS.md`, `feature_list.json`, `init.sh`, the checklist, and the rubric describe this tree |
| Clean State | C | No Reset button. The scored run emptied the library by deleting the directory printed in `Data directories initialized`. The next start was `Documents (0)` |
| Benchmarking | F | No `scripts/benchmark.sh`. The manual set was re-run; see the table above |

## Overall Grade: C

The core loop is verified in the window: import, index, cited answer, JSON logs, and restart. The grade stays C because there are no tests, no benchmark script, no feedback, and no in-app reset, and T1 still needed the console.

## Grade Movement (baseline window → this window)

| Dimension | Baseline | Now | Why |
|-----------|----------|-----|-----|
| Build & Compile | C | A | Type check passes |
| Documentation | C | B | Harness docs match this tree |
| Q&A with Citations | D | A | The fixed question returns the indexing answer at 85% with two `Retrieval Plan` citations |
| Document Import | C | B | The title is `Retrieval Plan`. The specified path still needed the console import |
| Indexing | C | A | Status is `indexed` and five non-empty chunks show in the detail pane |
| Feature Completeness | D | C | Those paths are connected in the window. Feedback, reset, tests, and scripts are still missing |
| ConversationHistory | D | C | Restart shows the saved question and answer. The list is still flat |
| Clean State | D | C | Emptying data is a directory delete, and that delete produced `Documents (0)` |
| Structured Logging | B | A | The scored run captured the three JSON lines |
| Persistence | B | A | Restart kept the indexed document and the Q&A history |
| Test Coverage | F | F | Still no tests |
| Benchmarking | F | F | Manual set re-run. Still no benchmark script |

## Critical Gaps

1. No feedback control.
2. No in-app reset.
3. No automated tests and no `scripts/benchmark.sh`.
4. T1 did not finish from the file dialog alone. The passing import was the console call of the project-06 `retrieval-plan.md`.

## Action Items

- [x] Fix renderer imports so `npm run check` passes
- [x] Wire Import to a file dialog and use the Markdown heading as the title
- [x] On single-document indexing, write `index-meta.json`, set status to `indexed`, and refresh the chunk list
- [x] Return a cited answer at 0.85 for the fixed indexing question
- [x] Return `AppStatus` from `indexing:status`
- [x] Delete the document's content, chunks, and index entry
- [x] Rewrite the harness docs to match this tree
- [x] Re-run `benchmark-tasks.md` in the window (5/5 complete, 4/5 strict)
- [ ] Add feedback on Q&A responses
- [ ] Add an in-app clean-state reset if the product should have one
- [ ] Add tests and, separately, a benchmark script if timing should be automated
