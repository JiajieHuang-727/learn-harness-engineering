# Product Description -- Knowledge Base

## What Is This?

A desktop application for a personal knowledge base. Import a text or Markdown file, index it into chunks, and ask questions. Answers cite the indexed chunks. Questions and answers stay on disk across restarts.

## Document Management

- Import `.txt` and `.md` files. The Import button opens the operating-system file dialog. Choosing Cancel does nothing.
- Validation: the file must exist, the extension must be `.txt` or `.md`, and the size must be at most 10 MB.
- The title is the first Markdown heading. `retrieval-plan.md` is titled `Retrieval Plan`. A file with no heading uses the filename without its extension, so `meeting-summary.txt` is titled `meeting-summary`.
- The sidebar shows the title, the size, and the word Indexed once the document has been indexed.
- The detail pane shows filename, import time, size, status, and chunk count.
- Show Chunks lists each chunk's index, character count, and full text.
- Delete asks for confirmation, then removes the document, its text, its chunks, and its index entry.

## Text Indexing

- Index Document splits the selected document on blank lines and keeps each chunk near 500 characters.
- The document status becomes `indexed`, and the chunk count is stored on the document.
- The chunk list reloads when that status and count change. Leaving the detail pane is not required.
- `indexing.start()` with no document id indexes every document that does not already have chunk ids.

## Grounded Q&A

- The question box sends the text as typed.
- The answer is chosen from seven mock patterns by counting keyword hits. The pattern with the most hits wins. An earlier pattern wins a tie.
- Up to two citations are attached. Each citation has the document title, the chunk index, and an excerpt.
- Confidence is 85% when a citation is attached, and 30% when none is.
- The indexing question below matches the indexing pattern, not the import pattern, because `index` and `chunk` outscore `document`:

```text
How does the indexing pipeline split documents into chunks?
```

That answer says the pipeline splits on paragraph boundaries at about 500 characters. With `retrieval-plan.md` indexed, the citations use the title `Retrieval Plan`.

## Conversation History

- Show History replaces the detail pane with a flat list.
- Each row shows the question, the answer, the citation count and confidence when citations exist, and the timestamp.
- Clear History removes the saved list immediately. There is no second confirmation.
- Hide History returns to the document view.

## Status Bar

- Index state: idle, indexing, ready, or error, with a colored dot.
- Document count (`documentsLoaded`).
- Last activity, shown only when at least one document has an import time. The value is the newest `importedAt`.

## Persistence

- Data is stored under the user-data directory printed at startup as `Data directories initialized`.
- The document list loads on startup.
- Saved questions and answers load when Show History is opened.
- There is no in-app reset. To start from an empty library, quit the app and delete that data directory.

## Constraints

- Maximum file size: 10 MB.
- Formats: `.txt` and `.md`.
- Answers come from the mock patterns. There is no LLM call and no network request.
- Logs are console JSON. They are not written to a file.
- There is no feedback control, no chat-bubble layout, and no benchmark or cleanup script in this tree.

## Performance Targets

These are targets for the manual tasks in `benchmark-tasks.md`. This tree does not ship a `scripts/benchmark.sh`.

- Import of a single sample file completes as a local copy and write.
- Indexing the retrieval-plan sample produces 5 non-empty chunks.
- A question returns without an artificial delay. The previous 100–500 ms sleep has been removed.
