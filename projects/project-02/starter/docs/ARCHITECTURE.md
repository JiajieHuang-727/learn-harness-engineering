# Architecture -- Knowledge Base Electron App

## System Overview

The Knowledge Base is an Electron desktop application built with TypeScript and React. It provides document import with file picker, text indexing with chunking, content viewing, and grounded question answering with citations.

## Layer Diagram

```
+-----------------------------------------------------------+
|                     Renderer (React)                       |
|  App.tsx -> DocumentList, DocumentDetail, ImportPanel,    |
|             QuestionPanel, StatusBar                       |
+-----------------------------------------------------------+
         |  window.knowledgeBase.* (typed IPC bridge)
+-----------------------------------------------------------+
|                     Preload Script                         |
|  contextBridge.exposeInMainWorld -> documents, indexing, qa|
+-----------------------------------------------------------+
         |  ipcRenderer.invoke(IPC_CHANNELS.*)
+-----------------------------------------------------------+
|                     Main Process                           |
|  main.ts -> createWindow(), initializeServices()          |
|  ipc-handlers.ts -> registerIpcHandlers()                  |
+-----------------------------------------------------------+
         |  Service method calls
+-----------------------------------------------------------+
|                     Services Layer                         |
|  DocumentService | IndexingService | QaService             |
|  PersistenceService (filesystem I/O)                       |
+-----------------------------------------------------------+
```

## Electron Layers

### Main Process (`src/main/`)

- **Window management**: Creates `BrowserWindow` instances with secure web preferences.
- **IPC registration**: Maps IPC channel names to service methods via `registerIpcHandlers()`.
- **Service initialization**: Constructs all services with dependency injection.

### Preload (`src/preload/`)

The preload script is sandboxed, so it cannot `require` other application modules. Channel name strings are inlined in `src/preload/preload.ts` and kept identical to `IPC_CHANNELS`. It exposes a typed API via `contextBridge`:

```typescript
window.knowledgeBase = {
  documents: { list, import, get, getContent, delete, pathForFile },
  indexing:   { start, status, chunks },
  qa:         { ask, history },
}
```

`documents.pathForFile` calls `webUtils.getPathForFile` in the preload script. It is synchronous and exists so the sandboxed renderer can turn a picked `File` into a filesystem path.

### Renderer (`src/renderer/`)

React 18 application bundled by Vite:

- `App.tsx` -- Root layout with import toggle, document selection, and Q&A.
- `DocumentList` -- Sidebar listing of imported documents.
- `DocumentDetail` -- Shows metadata, full content, chunks, and delete button.
- `ImportPanel` -- File input for importing .txt and .md documents.
- `QuestionPanel` -- Text input for asking questions.
- `StatusBar` -- Shows index status and document count.

### Services (`src/services/`)

- `PersistenceService` -- Low-level JSON/text file I/O with atomic writes.
- `DocumentService` -- Document CRUD. Metadata, extracted text, and a copy of the source file are stored through `PersistenceService`.
- `IndexingService` -- Paragraph-aware chunking (~500 chars) and index management. It reads `documents-meta.json` and `content/<id>.txt`.
- `QaService` -- Mock Q&A with keyword-based retrieval and citations.

## Import Flow

The document import flow demonstrates the full IPC data path:

```
1. User clicks "Import" button in App.tsx
2. ImportPanel renders file input
3. User selects a .txt or .md file
4. ImportPanel resolves the filesystem path with
   window.knowledgeBase.documents.pathForFile(file)
   Preload calls Electron webUtils.getPathForFile. The sandboxed renderer
   does not expose File.path.
5. ImportPanel calls onImport(filePath)
6. App.tsx calls window.knowledgeBase.documents.import(filePath)
7. Preload bridge invokes ipcRenderer.invoke('documents:import', filePath)
8. ipc-handlers.ts delegates to DocumentService.importDocument(filePath)
9. DocumentService:
   a. Validates the path is an existing file, the extension is .txt or .md,
      and the size is at most 10 MB
   b. Reads file content and stats from the source path
   c. Creates a Document metadata object
   d. Copies the source file into documents/ via PersistenceService
   e. Writes extracted text to content/<id>.txt
   f. Appends the metadata object to documents-meta.json
10. Result flows back through IPC
11. App.tsx calls refreshDocuments() to update the list
12. DocumentList re-renders with the new document
```

Unsupported files and files over 10 MB fail in the import panel before the library changes. The same checks run again in `DocumentService`, so a rejected import does not add a document or write files.

## Startup Load

`App` calls `refreshDocuments()` on mount. That invokes `documents:list`, and `DocumentService.listDocuments()` reads `documents-meta.json`. A restarted process shows the same library.

## Delete Flow

```
1. User clicks Delete in DocumentDetail
2. App calls window.knowledgeBase.documents.delete(id)
3. DocumentService removes the copied source file, content/<id>.txt,
   chunks/<id>.json, the document's entry in index-meta.json, and the
   metadata row in documents-meta.json
4. App clears the selection when it matches and refreshes the list
```

## Content Retrieval Flow

Document content viewing adds a dedicated IPC channel:

```
1. User clicks "View Content" in DocumentDetail
2. DocumentDetail calls window.knowledgeBase.documents.getContent(id)
3. Preload invokes 'documents:get-content' IPC
4. ipc-handlers delegates to DocumentService.getDocumentContent(id)
5. PersistenceService reads content/<id>.txt
6. Content flows back to renderer for display in a scrollable pre-wrap container
```

## Data Storage

Import and delete write this layout under the application data directory (`userData/knowledge-base-data`). `DocumentService` reads it back on every list, get, and content call, so the library survives a process restart.

```
knowledge-base-data/
  documents-meta.json     # Document metadata array
  documents/
    <filename>            # Copy of the imported source file
  content/
    <doc-id>.txt          # Extracted text content per document
  chunks/
    <doc-id>.json         # Chunk array per document
  index-meta.json         # Mapping of document IDs to chunk IDs
  qa-history.json         # Q&A interaction log
```

`IndexingService` writes `index-meta.json` at the data-directory root. `PersistenceService` also creates an empty `index/` directory for later index files.
