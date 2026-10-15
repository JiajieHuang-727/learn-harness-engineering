# Quality Document -- Project 06 Capstone

## Scoring Summary

Strong-harness snapshot, 2026-10-15, on `p06-improved` after `feb8fb7` (Add harness). `src/` is unchanged from the baseline. `npm run check` was re-run and still fails: `tsconfig.node.json` passes, `tsconfig.json` does not. The five benchmark tasks were not re-run. Product grades still use `baseline-benchmark-record.md`.

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Build & Compile | C | `npm run check` still fails. Renderer imports of `shared/types` are one directory too high (`../../shared/types` from `src/renderer`, `../../../shared/types` from components). Unused `React` imports, `ImportPanel` reads `File.path`, and `qa-service.ts` imports unused `Chunk`. Main `tsc` passes |
| Feature Completeness | D | Unchanged. Strict pass 1/5. Import still needs the console, answers have no feedback, and there is no reset control |
| ConversationHistory | D | `Show History` is still a flat list: question, answer, confidence. No chat bubbles, no feedback |
| Structured Logging | B | Unchanged. Import, index, and ask log JSON. `GET_STATUS`, `GET_HISTORY`, and `GET_INDEXING_STATUS` still log nothing |
| Q&A with Citations | D | Unchanged. Baseline T3 returned the import canned text, confidence 30%, `citationCount` 0. Single-document indexing still does not write `index-meta.json` |
| Document Import | C | Unchanged. `+ Import` only logs. Console import plus Refresh shows the file. Title is still the filename stem |
| Indexing | C | Unchanged. `startIndexing(documentId)` writes chunk JSON and returns. It does not update `index-meta.json` or document status. Batch indexing does both |
| Persistence | B | Unchanged. Baseline T5 kept the document, 5 chunks, and Q&A history across restart. Delete still leaves content and chunks behind |
| Test Coverage | F | No test files. Vitest is installed and unused |
| Documentation | C | Harness files are now in the tree, and they describe a different app. See the movement note below |
| Clean State | D | `resetAll()` is still only on `PersistenceService`. No `app:reset` channel, no Reset button. `clean-state-checklist.md` is present and every box is open |
| Benchmarking | F | Still no `scripts/benchmark.sh`. `init.sh` and `CLAUDE.md` tell the next session to run that script |

## Overall Grade: D

## Grade Movement (baseline → this snapshot)

Application code did not change, so product grades stay put. One grade moved.

| Dimension | Baseline | Now | Why |
|-----------|----------|-----|-----|
| Documentation | D | C | `CLAUDE.md`, `feature_list.json`, `init.sh`, `evaluator-rubric.md`, `clean-state-checklist.md`, and `docs/{ARCHITECTURE,PRODUCT,RELIABILITY}.md` were added. `AGENTS.md` was expanded. The new files claim feedback, reset, 14 IPC channels, chat history, and a 5.0/5 rubric. This tree has 11 channels in `src/shared/types.ts`, no feedback or reset channel, and the baseline UI defects |
| Build & Compile | C | C | Re-checked. Same renderer errors |
| Feature Completeness | D | D | `src/` unchanged. No new UI run |
| ConversationHistory | D | D | Same component |
| Structured Logging | B | B | Same handlers |
| Q&A with Citations | D | D | Same single-document index path |
| Document Import | C | C | `handleImport` still only logs |
| Indexing | C | C | Single-document path still skips `index-meta.json` |
| Persistence | B | B | Same persistence service |
| Test Coverage | F | F | Still no tests |
| Clean State | D | D | Checklist file added. Reset is still not reachable |
| Benchmarking | F | F | Scripts named in the harness were not added |

## What the Harness Adds

Present after `feb8fb7`:

- `AGENTS.md`, `CLAUDE.md`, `feature_list.json`, `init.sh`
- `evaluator-rubric.md`, `clean-state-checklist.md`
- `docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, `docs/RELIABILITY.md`
- `scripts/dev.js` and the three sample documents were already there

`init.sh` will not pass on this tree. `npm run check` fails at step 2. The file check also requires `session-handoff.md`, `scripts/benchmark.sh`, and `scripts/cleanup-scanner.sh`, which are absent. `evaluator-rubric.md` additionally marks `claude-progress.md` and `session-handoff.md` as present.

Claims that do not match `src/`:

- `feature_list.json` marks 15/15 features `pass`, including import, feedback, clean-state reset, benchmark scripts, and cleanup scanner
- `evaluator-rubric.md` scores 5.0/5 and lists 14 IPC channels
- `CLAUDE.md` lists `feedback:submit`, `feedback:list`, and `app:reset`. `IPC_CHANNELS` has none of those. It does have `conversation:get`, which no handler registers
- `docs/PRODUCT.md` describes a file picker, chat bubbles, thumbs, and a header Reset button. `App.tsx` has History and Refresh only

## Baseline Run (2026-10-15)

Evidence is in `baseline-benchmark-record.md`. That run did not change application code. It is still the latest UI evidence.

| Result | Value |
|--------|-------|
| Completion | 4/5 (pass, or finished with a defect) |
| Strict pass | 1/5 (T4 only) |
| Retries | 4 |
| Defects | 4 (T1, T2, T3, T5) |

Grade movement from the earlier code-only score to that run:

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
8. No tests and no benchmark script
9. The new harness files describe the solution app. An agent that trusts `feature_list.json`, `CLAUDE.md`, or `init.sh` will look for channels, buttons, and scripts this tree does not have

## Action Items

- [ ] Fix renderer imports so `npm run check` passes
- [ ] Wire the Import button to a real file path and use `Retrieval Plan` as the title
- [ ] On single-document indexing, write index-meta, set status to `indexed`, and refresh the chunk list
- [ ] Return a cited answer at 85% confidence for the fixed indexing question
- [ ] Return `AppStatus` from the status IPC
- [ ] Add feedback on Q&A responses
- [ ] Expose clean state reset through IPC and the UI
- [ ] Add tests and a benchmark script
- [x] Add the harness files (`CLAUDE.md`, `feature_list.json`, `init.sh`, docs, rubric, checklist)
- [ ] Rewrite those files so they match this tree, or implement the features they already mark as passing
- [ ] Add the files `init.sh` still requires: `session-handoff.md`, `scripts/benchmark.sh`, `scripts/cleanup-scanner.sh`
