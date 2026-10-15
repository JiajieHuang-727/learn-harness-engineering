# Quality Document -- Project 06 Capstone

## Scoring Summary

Baseline snapshot, 2026-10-15. Evidence is in `baseline-benchmark-record.md`. Application code was not changed during that run.

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Build & Compile | C | `npm run check` fails on renderer imports of `shared/types`. Main `tsc` and `vite build` pass. The baseline run did not re-run the compiler |
| Feature Completeness | D | Strict pass 1/5. Import still needs the console, answers have no feedback, and there is no reset control |
| ConversationHistory | D | `Show History` opens after restart and shows the question plus that answer. Still a flat list: no chat bubbles, no feedback |
| Structured Logging | B | T4 passed. Import, index, and ask each logged JSON with timestamp, level, service, and message. `GET_STATUS`, `GET_HISTORY`, and `GET_INDEXING_STATUS` still log nothing |
| Q&A with Citations | D | T3 failed after 2 retries. The answer was the import canned text, confidence 30%, `citationCount` 0. Single-document indexing never writes `index-meta.json`, so retrieval sees no chunks |
| Document Import | C | T1 finished with a defect. `+ Import` does not import. Console import plus Refresh shows `retrieval-plan`, 1.9 KB, status `imported`. The title is the filename stem |
| Indexing | C | T2 finished with a defect. Five chunks with real text are stored, including paragraph boundaries and ~500 characters. Status stays `imported`. The first `Show Chunks` reads 0 until the detail view is reopened |
| Persistence | B | T5 kept the document, 5 chunks, and the Q&A history across a full restart. Delete still leaves content and chunks behind; that path was not re-run |
| Test Coverage | F | No test files. Vitest is installed and unused |
| Documentation | D | `AGENTS.md`, this file, `benchmark-tasks.md`, and the baseline record. No `CLAUDE.md`, `feature_list.json`, or `init.sh` |
| Clean State | D | No reset control. The run started by deleting the data directory named in the launch log. `resetAll()` is still not on IPC or the UI |
| Benchmarking | F | The five tasks were scored by hand. There is still no benchmark script |

## Overall Grade: D

## Baseline Run (2026-10-15)

| Result | Value |
|--------|-------|
| Completion | 4/5 (pass, or finished with a defect) |
| Strict pass | 1/5 (T4 only) |
| Retries | 4 |
| Defects | 3 (T1, T2, T5) |

Grade movement since the code-only score on the same day:

- Q&A with Citations moved from C to D. The UI path returns no citations, and the fixed question hits the import canned answer.
- Every other dimension kept its grade. The run confirmed those notes.

## Critical Gaps

1. `npm run check` fails because renderer imports of `shared/types` use the wrong relative path
2. The Import button does not select or import a file. T1 needed the console, then Refresh
3. Index Document writes chunk files but not `index-meta.json` or document status. Q&A reads only that meta file, so citations stay empty. The chunk list also stays at 0 until the detail view is reopened
4. The fixed question matches the import canned answer because it contains "documents", and comes back at 30% confidence with no `Retrieval Plan` citation
5. Status IPC returns indexing fields, not `AppStatus`, so the status bar does not show index state
6. No feedback controls on answers
7. `resetAll()` is not reachable from IPC or the UI
8. No tests, no benchmark script, and no harness files beyond `AGENTS.md`

## Action Items

- [ ] Fix renderer imports so `npm run check` passes
- [ ] Wire the Import button to a real file path and use `Retrieval Plan` as the title
- [ ] On single-document indexing, write index-meta, set status to `indexed`, and refresh the chunk list
- [ ] Return a cited answer at 85% confidence for the fixed indexing question
- [ ] Return `AppStatus` from the status IPC
- [ ] Add feedback on Q&A responses
- [ ] Expose clean state reset through IPC and the UI
- [ ] Add tests and a benchmark script
- [ ] Create the missing harness files (`CLAUDE.md`, `feature_list.json`, `init.sh`, etc.)
