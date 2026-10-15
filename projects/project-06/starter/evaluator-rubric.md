# Evaluator Rubric -- Project 06 Capstone

Scores are for this tree after the 2026-10-15 cleanup. 1 is absent, 5 is the behavior in `docs/PRODUCT.md` checked in the running app.

The earlier 5.0 score described channels, feedback, reset, chat history, and scripts this tree did not have.

| Criterion | Score | Notes |
|-----------|-------|-------|
| Build & Compile | 5 | `npm run check` and `npm run build` pass |
| Window Launch | 4 | 1200x800, context isolation, preload. Not relaunched in this pass |
| Document Import | 4 | Dialog in the main process, 10 MB and extension checks, heading used as title. Service import of `retrieval-plan.md` returns `Retrieval Plan`. The dialog was not clicked in a window |
| Document Detail | 4 | Metadata, chunk list, Index, Delete with confirmation. Delete cleanup checked on the service |
| Text Indexing | 5 | Single-document index writes chunk JSON, `index-meta.json`, and `status: indexed`. The sample produced 5 non-empty chunks |
| Grounded Q&A | 4 | The fixed indexing question returns the indexing pattern, confidence 0.85, and two `Retrieval Plan` citations. Checked through the services, not the window |
| Conversation History | 3 | Flat list of saved Q&A with Clear History. No chat layout |
| Feedback Collection | 1 | No feedback type, channel, or control |
| Structured Logging | 4 | JSON logs on import, index, ask, and the read handlers. A live terminal was not captured in this pass |
| Clean State Reset | 1 | No reset control. Empty the data directory by deleting the path from the startup log |
| Persistence | 4 | Documents, chunks, index metadata, and Q&A history are files. Delete removes that document's files. Restart was not re-run |
| Status Bar | 4 | `indexing.status()` returns `AppStatus` (`documentsLoaded`, `indexStatus`, `lastActivity`) |
| Benchmark Scripts | 1 | No `scripts/benchmark.sh`. Manual tasks are `benchmark-tasks.md` |
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
