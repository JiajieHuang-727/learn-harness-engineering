# Quality Document -- Project 06 Capstone

## Scoring Summary

Cleanup pass, 2026-10-15, then the same five tasks from `benchmark-tasks.md` were run again in the window. Record: `cleanup-benchmark-record.md`. Completion 5/5, strict pass 4/5, 1 retry, 1 defect. T1 still needed the console import. T2, T3, T4, and T5 passed.

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Build & Compile | A | `npm run check` and `npm run build` pass. Renderer imports resolve to `src/shared/types.ts`. Unused `React` imports and the unused `Chunk` import are gone |
| Feature Completeness | C | Import, index, cited Q&A, delete, and status now have one path each. The window benchmark is 5/5 with one defect. Feedback, in-app reset, tests, and benchmark scripts are still absent |
| ConversationHistory | C | After restart, Show History showed the fixed question, the answer, `2 citation(s)`, `Confidence: 85%`, and the timestamp. Flat list. No chat bubbles and no feedback |
| Structured Logging | A | The scored run's terminal has JSON lines for import, index, and ask, each with timestamp, level, service, and message. `Answer generated` includes confidence and citation count |
| Q&A with Citations | A | Window: the fixed indexing question, confidence 85%, two `Retrieval Plan` citations, answer mentions paragraph boundaries and about 500 characters |
| Document Import | B | The Import button opens the native dialog. The dialog's first selection was a different copy of `retrieval-plan.md`. The specified project-06 file was imported with the console call the benchmark allows. Title `Retrieval Plan`, size 1.9 KB |
| Indexing | A | Window: `Status: indexed`, list shows `Indexed`, five non-empty chunks. Chunk 1 contains the paragraph-boundary and ~500 character lines |
| Persistence | A | Quit and relaunch kept `Retrieval Plan` as indexed, with 5 chunks and the T3 history entry. No re-import |
| Test Coverage | F | No test files. The check above was a one-off Node script against `dist/services` |
| Documentation | B | `docs/`, `CLAUDE.md`, `AGENTS.md`, `feature_list.json`, `init.sh`, the checklist, and the rubric describe this tree. They no longer claim 14 channels, feedback, reset, or the missing scripts |
| Clean State | C | No Reset button. The unused `resetAll` method was removed. The documented clean start is deleting the data directory from the startup log |
| Benchmarking | F | No `scripts/benchmark.sh`. The manual set was re-run: completion 5/5, strict pass 4/5, 1 retry, 1 defect. See `cleanup-benchmark-record.md` |

## Overall Grade: C

## Grade Movement (baseline → this cleanup)

| Dimension | Baseline | Now | Why |
|-----------|----------|-----|-----|
| Build & Compile | C | A | Type check passes |
| Documentation | C | B | Harness docs match the code |
| Q&A with Citations | D | A | Pattern choice uses the most keyword hits. The window showed 85% and two `Retrieval Plan` citations |
| Document Import | C | B | Heading title, type and size checks, dialog wired from the Import button |
| Indexing | C | A | Single-document index sets `indexed`. The window showed five non-empty chunks |
| Feature Completeness | D | C | Those paths are connected. Feedback, reset, and scripts are still missing |
| ConversationHistory | D | C | Still a flat list, now described as a flat list |
| Clean State | D | C | The false reset claim is gone. Emptying data is a directory delete |
| Structured Logging | B | A | The scored run captured JSON lines for import, index, and ask |
| Persistence | B | A | Restart kept the indexed document and the Q&A history |
| Test Coverage | F | F | Still no tests |
| Benchmarking | F | F | Manual set re-run. Still no benchmark script |

## What Changed

- Deleted `ImportPanel.tsx`, `ConversationMessage`, `conversation:get`, `app:status`, `logger.forService`, and unused persistence methods including `resetAll`.
- `IndexingService` takes the `DocumentService` and updates status through it. `QaService` takes that indexer and does not construct another one.
- The 100–500 ms sleep in `ask` is gone.
- `feature_list.json` marks feedback, in-app reset, benchmark scripts, and the cleanup scanner as `fail`.
- The window re-run is recorded in `cleanup-benchmark-record.md`.

## Critical Gaps

1. No feedback control.
2. No in-app reset.
3. No automated tests and no `scripts/benchmark.sh`.
4. The native Import dialog did not select the specified `retrieval-plan.md` on its own. T1 passed only after the console import.

## Action Items

- [x] Fix renderer imports so `npm run check` passes
- [x] Wire Import to a file dialog and use the Markdown heading as the title
- [x] On single-document indexing, write `index-meta.json`, set status to `indexed`, and refresh the chunk list
- [x] Return a cited answer at 0.85 for the fixed indexing question
- [x] Return `AppStatus` from `indexing:status`
- [x] Delete the document's content, chunks, and index entry
- [x] Rewrite the harness docs to match this tree
- [x] Re-run `benchmark-tasks.md` in the window (`cleanup-benchmark-record.md`: 5/5 complete, 4/5 strict)
- [ ] Add feedback on Q&A responses
- [ ] Add an in-app clean-state reset if the product should have one
- [ ] Add tests and, separately, a benchmark script if timing should be automated
