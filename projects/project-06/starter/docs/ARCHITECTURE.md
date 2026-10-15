# Architecture -- Knowledge Base Electron App

## System Overview

The Knowledge Base is an Electron desktop application built with TypeScript and React. It imports `.txt` and `.md` files, splits them into chunks, and answers questions with citations from those chunks. Structured JSON logs go to the console.

## Layer Diagram

```
+-----------------------------------------------------------+
|                     Renderer (React)                       |
|  App.tsx -> DocumentList, DocumentDetail,                  |
|             QuestionPanel, ConversationHistory, StatusBar  |
+-----------------------------------------------------------+
         |  window.knowledgeBase.* (typed IPC bridge)
+-----------------------------------------------------------+
|                     Preload Script                         |
|  contextBridge.exposeInMainWorld ->                       |
|    documents, indexing, qa                                 |
+-----------------------------------------------------------+
         |  ipcRenderer.invoke(IPC_CHANNELS.*)
+-----------------------------------------------------------+
|                     Main Process                           |
|  main.ts -> createWindow(), initializeServices()          |
|  ipc-handlers.ts -> registerIpcHandlers() (10 channels)   |
+-----------------------------------------------------------+
         |  Service method calls
+-----------------------------------------------------------+
|                     Services Layer                         |
|  DocumentService | IndexingService | QaService             |
|  PersistenceService (filesystem I/O)                       |
|  Logger (structured JSON output)                           |
+-----------------------------------------------------------+
```

## Electron Layers

### Main Process (`src/main/`)

- Creates one `BrowserWindow` (1200x800) with `contextIsolation: true` and `nodeIntegration: false`.
- Loads the built renderer from `dist/renderer/index.html` in both development and packaged runs.
- Registers IPC handlers after the services are constructed.
- Opens the native file dialog when import is called without a path.

### Preload (`src/preload/`)

```typescript
window.knowledgeBase = {
  documents: { list, import, get, delete },
  indexing:  { start, status, chunks },
  qa:        { ask, history, clearHistory },
}
```

`documents.import()` with no argument asks the main process to open the file dialog. `documents.import(filePath)` imports that path directly.

### Renderer (`src/renderer/`)

React 18 application bundled by Vite. It does not import Node.js modules.

- `App.tsx` switches between the document view and the history list, and keeps the selected document in sync with the latest metadata.
- `DocumentList` shows each document title, size, and an Indexed marker when `status` is `indexed`.
- `DocumentDetail` shows metadata, a chunk list, Index Document, and Delete.
- `QuestionPanel` submits a question.
- `ConversationHistory` is a flat list of saved questions and answers, with a Clear History button.
- `StatusBar` reads `AppStatus`: `indexStatus`, `documentsLoaded`, and `lastActivity`.

Shared types are imported from `src/shared/types.ts` (`../shared/types` in `App.tsx`, `../../shared/types` in components).

### Services (`src/services/`)

- `Logger` writes one JSON object per line through `logger.debug/info/warn/error(service, message, data)`.
- `PersistenceService` reads and writes JSON and text under the data directory.
- `DocumentService` validates, stores, updates, and deletes documents.
- `IndexingService` chunks text and is constructed with the same `DocumentService`, so status updates go through one writer.
- `QaService` is constructed with that same `IndexingService`. It does not create a second indexer.

## Data Flow

### Import

1. The Import button calls `documents.import()` with no path.
2. The main process opens a native open dialog filtered to `.txt` and `.md`. Cancel returns null.
3. `DocumentService.importDocument` checks that the file exists, is `.txt` or `.md`, and is at most 10 MB.
4. The title is the first Markdown heading (`# ...`). A file with no heading uses the filename without its extension.
5. The original file is copied under `documents/`, the text is stored at `content/<id>.txt`, and the record is appended to `documents-meta.json`.
6. The renderer reloads the list and selects the new document.

A caller can still pass an absolute path to `documents.import(filePath)` and skip the dialog. The same validation runs.

### Indexing

1. Index Document calls `indexing.start(documentId)`.
2. The service reads `content/<id>.txt`, splits on blank lines, and merges paragraphs until a chunk would pass about 500 characters.
3. Chunks are written to `chunks/<id>.json`.
4. `index-meta.json` is updated to `{ [documentId]: [chunkId, ...] }`. This file is what Q&A reads.
5. Document metadata is set to `status: "indexed"` and `chunks: <count>`.
6. The detail view reloads. The chunk list follows `document.status` and `document.chunks`, so the count updates without leaving the screen.

Calling `indexing.start()` with no id indexes every document that is not already in `index-meta.json`, and repairs a document whose metadata still says `imported` even though chunk ids exist.

### Question answering

1. The question box calls `qa.ask(question)`.
2. `QaService` loads every chunk listed in `index-meta.json`.
3. It scores chunks by how many question words (length greater than 2) appear in the chunk, and keeps the top two with a score above zero as citations.
4. It scores the mock answer patterns the same way and uses the pattern with the most keyword hits. A tie keeps the earlier pattern.
5. Confidence is `0.85` when there is at least one citation, and `0.30` otherwise.
6. The question and response are appended to `qa-history.json`.

The fixed question "How does the indexing pipeline split documents into chunks?" hits the indexing pattern twice (`index`, `chunk`) and the import pattern once (`document`), so the indexing answer is the one returned.

### Delete

1. Delete asks for confirmation, then calls `documents.delete(id)`.
2. The service removes the copied file, `content/<id>.txt`, `chunks/<id>.json`, the `index-meta.json` entry, and the metadata row.
3. The list reloads. If the deleted document was selected, the detail pane closes.

## IPC Channels (10)

| Channel | Direction | Handler | Purpose |
|---------|-----------|---------|---------|
| `documents:list` | R -> M | `DocumentService.listDocuments` | List documents |
| `documents:import` | R -> M | dialog, then `DocumentService.importDocument` | Pick and import a file |
| `documents:get` | R -> M | `DocumentService.getDocument` | Get one document |
| `documents:delete` | R -> M | `DocumentService.deleteDocument` | Delete a document and its files |
| `indexing:start` | R -> M | `IndexingService.startIndexing` | Index one document or all |
| `indexing:status` | R -> M | `IndexingService.getStatus` | Status bar fields |
| `indexing:chunks` | R -> M | `IndexingService.getChunksForDocument` | Chunks for one document |
| `qa:ask` | R -> M | `QaService.ask` | Ask a question |
| `qa:history` | R -> M | `QaService.getHistory` | Saved questions and answers |
| `qa:clear-history` | R -> M | `QaService.clearHistory` | Clear saved questions and answers |

`indexing.status()` returns `AppStatus`:

```typescript
{
  documentsLoaded: number;
  indexStatus: 'idle' | 'indexing' | 'ready' | 'error';
  lastActivity: string; // newest document importedAt, or ''
}
```

`indexStatus` is `ready` when every imported document has an `index-meta.json` entry, `indexing` when only some do, `idle` when none do, and `error` when a single-document index cannot find the content file.

## Data Storage

The directory is `app.getPath('userData')/knowledge-base-data`. The startup log line `Data directories initialized` prints the absolute path.

```
knowledge-base-data/
  documents-meta.json     # Document metadata array
  content/
    <doc-id>.txt          # Extracted text
  documents/
    <filename>            # Original file copy
  chunks/
    <doc-id>.json         # Chunk array for one document
  index-meta.json         # document id -> chunk ids
  qa-history.json         # Q&A log
```

`index-meta.json` lives in the data root. There is no `index/` directory and no `feedback.json`.

## Logging

```json
{
  "timestamp": "2026-10-15T12:00:00.000Z",
  "level": "INFO",
  "service": "document-service",
  "message": "Document imported",
  "data": {
    "documentId": "abc-123",
    "filename": "retrieval-plan.md",
    "size": 1931
  }
}
```

- DEBUG: listing documents and read-only IPC (`GET_DOCUMENT`, `GET_INDEXING_STATUS`, `GET_CHUNKS`, `GET_HISTORY`).
- INFO: import, update, delete, indexing, questions, and answers.
- WARN: a requested document is missing, or batch indexing skips a document with no content file.
- ERROR: import validation failures, and a single-document index with no content file.

`LOG_LEVEL` selects the minimum level. The default is `DEBUG`.
