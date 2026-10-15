# Evaluator Rubric -- Project 06 Capstone

Scores are for this tree after the 2026-10-15 cleanup and the window re-run of `benchmark-tasks.md`. 1 is absent, 5 is the behavior in `docs/PRODUCT.md` checked in the running app.

The earlier 5.0 score described channels, feedback, reset, chat history, and scripts this tree did not have.

| Criterion | Score | Notes |
|-----------|-------|-------|
| Build & Compile | 5 | `npm run check` and `npm run build` pass |
| Window Launch | 5 | Relaunched on a clean data directory and again for the restart task. Window showed the document list |
| Document Import | 4 | Dialog opens from Import. The first selection was another copy of `retrieval-plan.md`. The specified file was imported with the console call, title `Retrieval Plan` |
| Document Detail | 5 | Detail showed filename, size, `Status: indexed`, and five chunks. Delete confirmation removed the wrong import |
| Text Indexing | 5 | Window: `Status: indexed`, five non-empty chunks, including the paragraph and ~500 character lines |
| Grounded Q&A | 5 | Window: fixed indexing question, confidence 85%, two `Retrieval Plan` citations, paragraph and 500-character answer |
| Conversation History | 3 | After restart, Show History showed the saved question, answer, citation count, confidence, and timestamp. Flat list, no chat layout |
| Feedback Collection | 1 | No feedback type, channel, or control |
| Structured Logging | 5 | Live terminal JSON for import, index, and ask, each with timestamp, level, service, and message |
| Clean State Reset | 1 | No reset control. Empty the data directory by deleting the path from the startup log |
| Persistence | 5 | Quit and relaunch kept the indexed document, its chunks, and the Q&A history |
| Status Bar | 5 | Window showed `Index: idle` then `Index: ready`, `Documents: 1`, and last activity |
| Benchmark Scripts | 1 | No `scripts/benchmark.sh`. Manual re-run: completion 5/5, strict pass 4/5 |
| Cleanup Scanner | 1 | No `scripts/cleanup-scanner.sh` |
| Harness docs | 4 | `AGENTS.md`, `CLAUDE.md`, `feature_list.json`, `init.sh`, and `docs/` describe this tree |

## IPC Channels

10 channels, all registered and exposed:

- `documents:list`, `documents:import`, `documents:get`, `documents:delete`
- `indexing:start`, `indexing:status`, `indexing:chunks`
- `qa:ask`, `qa:history`, `qa:clear-history`

## Not in this tree

- Feedback submit/list
- `app:reset` and `app:status`
- `conversation:get`
- Chat bubbles, thumbs, and a header Reset button
- `scripts/benchmark.sh`, `scripts/cleanup-scanner.sh`
- Vitest tests
