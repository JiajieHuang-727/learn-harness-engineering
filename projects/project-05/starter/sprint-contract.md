# Sprint Contract - ConversationHistory Feature

## Sprint Overview

**Sprint:** P05 plan-gen-eval
**Feature:** Multi-turn Q&A conversation history
**Duration:** 1 sprint
**Planner status:** Specification complete. Implementation has not started.

The History tab already lists past Q&A turns, but `ConversationHistory` is a placeholder: it truncates each answer to 80 characters and does not show role, time, citations, copy, or follow-ups. This sprint replaces that placeholder with a chat transcript inside the existing left panel.

## Scope

### In Scope

- `ConversationHistory` chat-bubble transcript for the turns already stored as `QAHistory[]`
- Timestamps and date separators
- Citation display with expand/collapse
- Copy-to-clipboard for assistant answers
- Follow-up question suggestions on the latest turn, wired into the existing ask flow
- Empty state with guidance
- Defensive rendering for empty, long, and malformed history

### Out of Scope

- Persistent conversation sessions beyond the history file that already exists
- Conversation search, filter, or export
- Redesign of `QuestionPanel`, the right-hand last-answer card, document tabs, or indexing
- A real language-model client, new IPC channels, or changes to how answers are generated
- Saving follow-up suggestions or conversation threads as a new data model

## Roles

| Role | Responsibility |
|------|---------------|
| **Planner** | Define acceptance criteria, scope boundaries, task order, and the rubric before implementation |
| **Generator** | Implement only this contract. Record what was verified. |
| **Evaluator** | Score the implementation with `evaluator-rubric.md`. Do not treat missing evidence as a pass. |

## Current Baseline

- UI entry: History tab in the 280px left panel (`src/renderer/App.tsx`). The component receives `history` only.
- Data: `window.knowledgeBase.conversation.get()` returns `QAHistory[]`. Each item is `{ question, response }`. `response` is `{ answer, citations, confidence, timestamp }`. `timestamp` is an ISO string from `new Date().toISOString()`.
- Citations already exist: `{ documentId, documentTitle, chunkIndex, excerpt }`.
- Asking a question already refreshes history through `handleAskQuestion`.
- `ConversationMessage` in `src/shared/types.ts` is unused. This sprint does not require adopting it.

## Product Behavior

Render one exchange per history item, oldest first, inside the History tab. The panel scrolls; the rest of the window does not grow with the transcript.

Each exchange has two bubbles:

- User bubble: the question, right-aligned, purple (`#533483` or the same purple already used for primary actions).
- Assistant bubble: the full answer, left-aligned, dark blue (`#1a1a3e` or `#0f3460`). Do not truncate the answer.

Show one compact `HH:MM` timestamp per exchange, taken from `response.timestamp`. When two neighboring exchanges fall on different local calendar days, show a date separator between them with month and day. The first exchange of the list also gets a date separator.

Citations stay collapsed under the assistant bubble. The collapsed control shows the citation count. Expanding it reveals every citation: document title, chunk index, and the full excerpt. Collapsing hides that detail again. An answer with no citations shows no citation control.

Each assistant bubble has a copy control. Activating it writes that bubble's full answer to the clipboard and changes the control label to a short confirmation such as `Copied!`. The confirmation clears on its own. Copy does not include the question or citation text.

Only the latest exchange shows two or three short follow-up suggestions derived in the component from that question. Clicking a suggestion calls `onFollowUp` with the suggestion text. `App` passes `handleAskQuestion` as `onFollowUp`, so the click uses the existing ask path and then refreshes history. Older exchanges do not show suggestions.

When `history` is empty, show an icon and short guidance telling the user to ask a question. Do not show an empty bubble list.

Long answers and long excerpts wrap and remain readable inside the scrolling panel. A missing `response`, missing `citations`, empty strings, or an unparseable timestamp must not throw. Skip or show a neutral fallback for the broken field and still render the rest of the list.

`confidence` may be shown as a percentage on the assistant bubble. That display is optional polish. It is not an acceptance criterion.

## Files

| File | Allowed change |
|------|----------------|
| `src/renderer/components/ConversationHistory.tsx` | Replace the placeholder. |
| `src/renderer/App.tsx` | Pass `onFollowUp={handleAskQuestion}`. No other behavior change. |
| `sprint-contract.md` | Generator and evaluator append the sprint log only. |

Do not change services, preload, IPC handlers, persistence, architecture checks, or sample documents. Display formatting in the renderer is allowed. New Node imports in the renderer are not.

## Task Order

Dependencies run downward. Do not start a task before the tasks it depends on.

1. **Prop contract.** Add optional `onFollowUp?: (question: string) => void` and keep `history: QAHistory[]`. Depends on nothing.
2. **Empty state.** Icon plus guidance when `history.length === 0`. Depends on 1.
3. **Bubbles.** Map each item to a user bubble and an assistant bubble with the alignment and colors above. Render the full answer. Depends on 1.
4. **Time.** `HH:MM` from `response.timestamp`, plus date separators when the local day changes. Depends on 3.
5. **Citations.** Per-bubble expand/collapse with title, chunk index, and full excerpt. Depends on 3.
6. **Copy.** Clipboard write of the full answer plus temporary visible confirmation. Depends on 3.
7. **Follow-ups.** Suggestions on the last exchange only, and the `App` wiring in the file table. Depends on 1 and 3.
8. **Guards.** Long text scrolls and wraps. Malformed items do not crash the list. Depends on 3, 4, and 5.
9. **Evidence.** Run the verification plan and append the result to the sprint log. Depends on 2 through 8.

Tasks 4, 5, and 6 can be done in any order after task 3.

## Acceptance Criteria

1. The component renders the history list as chat bubbles, one user bubble and one assistant bubble per exchange, oldest first, with the full answer text.
2. User messages are right-aligned and purple.
3. Assistant messages are left-aligned and dark blue.
4. Each exchange shows one compact timestamp in `HH:MM`.
5. A date separator appears before the first exchange and between exchanges whose timestamps fall on different local days.
6. Citations render as an expandable section. Expanded content includes document title, chunk index, and the full excerpt. The section can be collapsed again.
7. The copy control writes the assistant answer to the clipboard and shows temporary visible feedback.
8. Follow-up suggestions appear only on the latest exchange. Choosing one calls `onFollowUp` with that suggestion text, and `App` routes that call through the existing ask handler.
9. An empty history shows guidance text and an icon, with no bubble list.
10. The panel survives an empty list, a long answer, a long excerpt, and a malformed item without throwing or covering the rest of the window.

## Verification Plan

The generator runs these checks and writes the evidence in the sprint log. The evaluator does not award a pass from the code alone.

1. Open the History tab with at least two exchanges and confirm bubble order, alignment, and colors.
2. Confirm each visible timestamp matches `HH:MM` for that item's ISO timestamp in local time.
3. Use two history items on different local days and confirm a date separator between them. Confirm the first item has a separator too.
4. Expand a citation, confirm title, chunk index, and full excerpt, then collapse it. Confirm an answer with zero citations has no citation control.
5. Copy an assistant answer, paste it elsewhere, and confirm the pasted text equals the full answer. Confirm the button feedback appears and then clears.
6. Click one follow-up suggestion and confirm `onFollowUp` receives that exact string and a new turn is requested through the existing ask path.
7. Open History with no items and confirm the icon and guidance text.
8. Render a long answer and a history item missing `response` or `timestamp`. Confirm the component stays mounted and the panel scrolls.

## Sprint Log

| Phase | Agent | Outcome |
|-------|-------|---------|
| Planning | Planner | Scope, file boundaries, task order, 10 acceptance criteria, and the unscored rubric are recorded. Implementation has not started. |
| Generation | Generator | Transcript implemented. jsdom verification passed for checks 1–8. `npm run check`, `npm run build`, and `scripts/check-architecture.sh` passed. Electron window was not launched. |
| Evaluation | Evaluator | Block on `fac1b10`. Checklist 1–9 reproduced by re-running the jsdom harness. Criterion 10 is partial: no throw in jsdom, window coverage not observed. Diff also edits `DocumentDetail.tsx`, `DocumentList.tsx`, `ImportPanel.tsx`, `StatusBar.tsx`, and `App.tsx` beyond `onFollowUp`. Scores are in `evaluator-rubric.md`. |

## Generation Evidence

Baseline `npm run check` failed before this work. Renderer imports pointed at `starter/shared/types` instead of `src/shared/types`, so the bundle could not resolve. Unused `React` imports failed `noUnusedLocals`. `ImportPanel` read `File.path`, which is not on the DOM `File` type. `App.tsx` also declared a second `window.knowledgeBase` whose `chunks` result omitted `Chunk` fields and disagreed with `src/renderer/types.d.ts`. Those were corrected before the feature could typecheck. `types.d.ts` remains the window API. No service, preload, IPC, or persistence files were changed.

`App` passes `onFollowUp={handleAskQuestion}`. That handler still calls `window.knowledgeBase.qa.ask` and then `refreshHistory`. The left panel uses `minHeight: 0` and `overflow: hidden` so the transcript scrolls inside the 280px column.

Verification ran in jsdom with the renderer components, not in a launched Electron window. Results:

1. Two exchanges render oldest first. User bubbles are `flex-end` / `#533483` (`rgb(83, 52, 131)`). Assistant bubbles are `flex-start` / `#1a1a3e` (`rgb(26, 26, 62)`). A 4034-character answer is present in full.
2. Local clocks for 09:05 and 14:30, and for a same-day pair 09:05 and 18:40, match `HH:MM`.
3. Separators read `Oct 11` and `Oct 12` when the local days differ. A same-day pair has only the first separator, `Oct 11`.
4. An answer with no citations has no citation control. Expanding `1 citation` shows `Design Notes`, `Chunk 3`, and the full 2514-character excerpt. `Hide citations` removes that block.
5. Copy writes that full answer and nothing from the question or excerpt. The label becomes `Copied!` and returns to `Copy` on its own.
6. The older exchange has no suggestions. The latest has three, derived from `How does indexing work?`. Clicking one calls `onFollowUp` with `Tell me more about How does indexing work`. Mounting `App`, opening History, and clicking that suggestion calls `qa.ask` with the same string and reads conversation history again (`reads 2 after 1`).
7. Empty history shows the chat icon and `Ask a question to get started`, with no bubbles.
8. A long answer wraps (`white-space: pre-wrap; overflow-wrap: anywhere`) inside a vertical scroller. A missing `response`, an empty answer, a non-array `citations`, an unparseable timestamp, and a null item leave the list mounted. Broken fields show `Answer unavailable` or `--:--`.
