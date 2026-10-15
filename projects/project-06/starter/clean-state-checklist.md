# Clean State Checklist

Run this before committing and at the end of a session.

## Build

- [ ] `npm run check` passes with no type errors
- [ ] `npm run build` completes
- [ ] No unused variables or imports in the type check

## Architecture

- [ ] No `fs` or `path` imports in `src/renderer/`
- [ ] No Electron IPC imports in `src/services/`
- [ ] No React imports in services or the main process
- [ ] IPC channel names live only in `src/shared/types.ts`
- [ ] APIs used by the renderer are exposed in `src/preload/preload.ts`
- [ ] Renderer imports of `shared/types` resolve under `src/shared/`

## Runtime

- [ ] `npm run dev` opens the window
- [ ] Startup prints a JSON line, `Data directories initialized`, with the data directory
- [ ] Import opens a file dialog. A `.md` file with a heading uses that heading as the title
- [ ] Index Document sets status to `indexed`, writes `index-meta.json`, and the chunk list shows non-empty chunks without reopening the document
- [ ] The indexing question returns text about paragraph boundaries or about 500 characters, a `Retrieval Plan` citation, and 85% confidence
- [ ] Show History lists that question after it has been asked
- [ ] Delete removes the document from the list
- [ ] The status bar shows an index state and the document count

## Logging

- [ ] Log lines are single JSON objects with `timestamp`, `level`, `service`, and `message`
- [ ] Import logs `Document imported` or `IPC: IMPORT_DOCUMENT`
- [ ] Index logs `Single document indexed` or `IPC: START_INDEXING`
- [ ] A question logs `Answer generated` with `confidence` and `citationCount`, or `IPC: ASK_QUESTION`

## Data

- [ ] After delete, `content/<id>.txt`, `chunks/<id>.json`, and the `index-meta.json` entry for that id are gone
- [ ] Quit and relaunch keeps the remaining documents and `qa-history.json`
- [ ] A clean run starts from an empty list after the data directory from the startup log is deleted

## Repository

- [ ] `git status` has no unintended files
- [ ] `dist/` is not committed
- [ ] `feature_list.json` matches the code, including features that are still `fail`
- [ ] `session-handoff.md` is updated when the session ends
