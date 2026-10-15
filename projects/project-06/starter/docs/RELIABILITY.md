# Reliability -- Logging and a Clean Data Directory

## Structured Logging

Every service writes one JSON object per line:

```json
{
  "timestamp": "2026-10-15T12:00:00.000Z",
  "level": "INFO",
  "service": "indexing-service",
  "message": "Single document indexed",
  "data": {
    "documentId": "abc-123",
    "chunkCount": 5
  }
}
```

Call `logger.debug`, `logger.info`, `logger.warn`, or `logger.error` with the service name, message, and optional data. There is no child logger.

| Level | When |
|-------|------|
| DEBUG | Listing documents, and read-only IPC |
| INFO | Import, metadata update, delete, indexing, question, answer, history clear |
| WARN | Missing document on get, update, or delete; batch index skips a document with no content |
| ERROR | File missing, unsupported type, over 10 MB, single-document index with no content |

`LOG_LEVEL` sets the minimum. Unset means `DEBUG`.

```bash
LOG_LEVEL=INFO npm run dev
```

IPC mutations log at INFO (`IMPORT_DOCUMENT`, `DELETE_DOCUMENT`, `START_INDEXING`, `ASK_QUESTION`, `CLEAR_HISTORY`). Reads log at DEBUG (`LIST_DOCUMENTS`, `GET_DOCUMENT`, `GET_INDEXING_STATUS`, `GET_CHUNKS`, `GET_HISTORY`). A canceled file dialog logs `IPC: IMPORT_DOCUMENT canceled`.

Service messages to look for during the manual tasks:

| Action | Message |
|--------|---------|
| Import | `Document imported` or `IPC: IMPORT_DOCUMENT` |
| Index | `Single document indexed` or `IPC: START_INDEXING` |
| Question | `Answer generated` (includes `confidence` and `citationCount`) or `IPC: ASK_QUESTION` |

## Clean Data Directory

There is no Reset button and no `app:reset` channel. `PersistenceService` does not delete the data directory by itself.

To run from an empty library:

1. Start the app once if the path is unknown.
2. Quit it and confirm the `npm run dev` process has exited.
3. Delete the directory printed in `Data directories initialized`.
4. Start again. The document list is empty, and `Listing documents` reports `count: 0`.

That directory holds `documents-meta.json`, `content/`, `documents/`, `chunks/`, `index-meta.json`, and `qa-history.json`. Deleting a document through the UI removes that document's files and its `index-meta.json` entry. It does not clear other documents or the Q&A history.

## Manual Tasks

`benchmark-tasks.md` is the fixed five-task check. It is not a shell benchmark. `scripts/benchmark.sh` and `scripts/cleanup-scanner.sh` are not in this tree.

After a code change, `npm run check` and `npm run build` are the automated gates. The import, index, question, and delete behavior can also be exercised by constructing the services against a temporary directory; they do not import Electron.
