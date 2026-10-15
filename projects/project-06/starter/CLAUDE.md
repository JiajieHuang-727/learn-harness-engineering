# CLAUDE.md -- Quick Reference for Claude Code

## Project Overview

This is the capstone Electron + TypeScript + React knowledge base: import, indexing, cited Q&A, a flat history list, and JSON logs.

## Build & Run

```bash
npm install        # Install dependencies
npm run check      # Type-check without emitting
npm run build      # Compile main/preload + bundle renderer
npm run dev        # Build + launch Electron
```

## Quick Start

```bash
bash init.sh       # Full verification: install, check, build
```

## Key Files

| File | Purpose |
|------|---------|
| `src/main/main.ts` | Electron entry point, window creation, service wiring |
| `src/main/ipc-handlers.ts` | IPC channel registration (10 channels) |
| `src/preload/preload.ts` | contextBridge API (`documents`, `indexing`, `qa`) |
| `src/renderer/App.tsx` | Root React component with view switching |
| `src/renderer/components/ConversationHistory.tsx` | Flat Q&A history list |
| `src/services/logger.ts` | Structured JSON logging with log levels |
| `src/services/persistence-service.ts` | File I/O |
| `src/services/document-service.ts` | Document CRUD with validation |
| `src/services/indexing-service.ts` | Chunking, index metadata, and status |
| `src/services/qa-service.ts` | Q&A with citations |
| `src/shared/types.ts` | Shared types and IPC channel constants |
| `feature_list.json` | Feature tracking with pass/fail status and evidence |
| `benchmark-tasks.md` | Fixed five-task manual check |

## Architecture Rules

- Renderer never imports Node.js modules.
- All main-renderer communication goes through IPC.
- Services use constructor-injected `PersistenceService`.
- IPC channel names live in `src/shared/types.ts`.
- Services log with `logger.info(serviceName, message, data)` and the other level methods.

## IPC Channels (10)

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `documents:list` | R -> M | List all documents |
| `documents:import` | R -> M | Pick a file, or import a given path |
| `documents:get` | R -> M | Get document by ID |
| `documents:delete` | R -> M | Delete document and its files |
| `indexing:start` | R -> M | Start indexing |
| `indexing:status` | R -> M | Get `AppStatus` for the status bar |
| `indexing:chunks` | R -> M | Get chunks for document |
| `qa:ask` | R -> M | Ask a question |
| `qa:history` | R -> M | Get Q&A history |
| `qa:clear-history` | R -> M | Clear Q&A history |

## How to Add a Feature

1. Define the IPC channel in `src/shared/types.ts`.
2. Add the handler in `src/main/ipc-handlers.ts` with logging.
3. Expose the API in `src/preload/preload.ts`.
4. Add the type declaration in `src/renderer/types.d.ts`.
5. Build the UI in `src/renderer/components/`.
6. Add logging calls to the service method.
7. Update `feature_list.json` with the result.

## Testing

```bash
npm run check
npm run build
```

Vitest is installed and there are no test files. The manual tasks are in `benchmark-tasks.md`.
