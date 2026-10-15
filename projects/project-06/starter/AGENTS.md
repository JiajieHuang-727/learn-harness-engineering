# AGENTS.md -- Project 06: Runtime Observability and Debugging (Capstone)

## Startup Rules

Before writing any code, complete these steps in order:

1. **Read this file completely.** It defines the boundaries and conventions for this project.
2. **Read `CLAUDE.md`** for the quick reference if using Claude Code.
3. **Read `docs/ARCHITECTURE.md`** to understand the full Electron layer structure and data flow.
4. **Read `docs/PRODUCT.md`** to understand the complete feature requirements.
5. **Read `docs/RELIABILITY.md`** to understand logging, observability, and clean state requirements.
6. **Run `bash init.sh`** to verify the project builds and initializes cleanly.
7. **Read `feature_list.json`** to see the current state of all features.

## Project Context

This is the **capstone project** for the Learn Harness Engineering course. It combines all features from Projects 01-05 into a single complete product:

- Document import with validation, including a native file dialog
- Text indexing that records chunk ids and marks the document indexed
- Grounded Q&A with citations
- A flat conversation history
- Structured JSON logging
- Delete that removes the document's files and index entry

Feedback controls, an in-app reset, `scripts/benchmark.sh`, and `scripts/cleanup-scanner.sh` are not in this tree.

## Docs Hierarchy

The `docs/` directory is organized for agent readability:

```
docs/
  ARCHITECTURE.md   -- Electron layers, data flow, full pipeline
  PRODUCT.md        -- Feature requirements and user-facing behavior
  RELIABILITY.md    -- Logging and how to empty the data directory
```

When adding new features, update the relevant doc before writing code.

## Electron Layer Boundaries

### Main Process (`src/main/`)
- Owns BrowserWindow lifecycle and IPC registration.
- All filesystem access happens here via services.
- Structured logging for all IPC events.

### Preload (`src/preload/`)
- The ONLY bridge between main and renderer.
- Uses `contextBridge.exposeInMainWorld` to expose typed APIs.
- Exposes: documents, indexing, qa.

### Renderer (`src/renderer/`)
- React + TypeScript UI layer.
- Communicates exclusively through `window.knowledgeBase` API.
- Never imports Node.js modules.

### Services (`src/services/`)
- Pure TypeScript business logic in the main process.
- Constructor-injected `PersistenceService`.
- All services log JSON through `logger.debug/info/warn/error`.

## Conventions

- TypeScript strict mode. No `any` without a comment explaining why.
- Named exports only.
- IPC channels defined once in `src/shared/types.ts`.
- New IPC channels follow the pattern: `namespace:action`.
- Log with `logger.debug/info/warn/error(serviceName, message, data)`.
- All service methods must log at INFO level for significant events.
- DEBUG level for routine data access.
- WARN for missing but non-critical data.
- ERROR for failures.

## Definition of Done

A feature is "done" when:

1. TypeScript compiles without errors (`npm run check`).
2. The app launches and the window is visible.
3. The feature appears in `feature_list.json` with status `"pass"` and evidence.
4. The code respects Electron layer boundaries.
5. Structured logging covers all service operations.
6. `docs/ARCHITECTURE.md` and/or `docs/PRODUCT.md` are updated.
7. `clean-state-checklist.md` passes all checks.

## Session Handoff

When resuming work, read `session-handoff.md` for context from the previous session. When finishing a session, update it with:

- What was accomplished
- What remains
- Any blockers or decisions made
- Files that were modified
- Benchmark results if applicable

## Clean State

Before each major testing cycle:

1. Quit the app and delete the data directory printed by `Data directories initialized`. There is no in-app reset.
2. Verify `clean-state-checklist.md`.
3. Run the five tasks in `benchmark-tasks.md` when a UI pass is required. There is no `scripts/benchmark.sh` or `scripts/cleanup-scanner.sh`.
