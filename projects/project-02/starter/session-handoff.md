# Session Handoff -- Project 02

## Last Session: 2026-09-27

### What Was Accomplished

1. **Document Import** -- File picker imports `.txt` and `.md` files into an in-memory library:
   - ImportPanel resolves the real path with `documents.pathForFile` (`webUtils.getPathForFile`)
   - Other extensions and files over 10 MB fail in the panel and do not change the library
   - `DocumentService.importDocument()` validates the same rules, then keeps metadata and text in memory

2. **Document Detail with Content** -- DocumentDetail shows metadata and loaded text:
   - Added `documents:get-content` and `documents.getContent`
   - View Content loads the in-memory text into a scrollable pre-wrap container
   - Delete removes that document from memory and clears the selection when it matches

### What Remains

- **Basic persistence** is not started. Restarting the app clears the library. Import does not copy the source file, write `content/<id>.txt`, or update `documents-meta.json`. `App` does not call `refreshDocuments()` on mount.
- Indexing still reads on-disk content, so Index Document does not see documents imported in this session.

### Decisions Made

- Kept document metadata and extracted text in `DocumentService` memory so persistence can be added in a later session without changing the IPC shape.
- `PersistenceService` is still constructed and injected, and is unused by import, list, content, and delete.
- Added `GET_DOCUMENT_CONTENT` instead of returning text from `documents:get`, so list payloads stay small.
- Validation runs in the import panel and again in `DocumentService`.

### Files Modified

- `src/services/document-service.ts` -- In-memory import, content, and delete, with extension and size checks
- `src/shared/types.ts` -- Added `GET_DOCUMENT_CONTENT`
- `src/main/ipc-handlers.ts` -- Registered `documents:get-content`
- `src/preload/preload.ts` -- Exposed `getContent` and `pathForFile`. Channel names are inlined because a sandboxed preload cannot require `shared/types`.
- `src/renderer/App.tsx` -- Import toggle, list refresh, delete selection clearing
- `src/renderer/components/ImportPanel.tsx` -- File picker, path resolution, inline errors
- `src/renderer/components/DocumentDetail.tsx` -- View Content, metadata, delete
- `src/renderer/types.d.ts` -- `getContent` and `pathForFile` types
- `src/renderer/components/DocumentList.tsx`, `src/renderer/components/StatusBar.tsx` -- Correct shared type imports
- `src/services/qa-service.ts` -- Removed unused `Chunk` import so `npm run check` passes
- `tests/document-service.test.ts` -- Import, rejection, and delete coverage
- `vite.config.ts` -- Point Vitest at `tests/`
- `docs/ARCHITECTURE.md`, `docs/PRODUCT.md` -- In-memory import and deferred persistence
- `feature_list.json` -- Import and detail marked pass; persistence still not started

### Blockers

None.

### Next Steps

Persist the in-memory library through `PersistenceService`: copy the source file, write `content/<id>.txt` and `documents-meta.json`, delete those files with the document, and call `refreshDocuments()` on mount so the list survives a restart.
