# Sprint Contract - ConversationHistory

## Sprint Overview

**Feature:** Multi-turn Q&A conversation history
**Surface:** Renderer only. History data already comes from `conversation.get()` / `QAHistory`.

## Scope

### In Scope

- ConversationHistory component with chat bubble layout
- Timestamps and date separators
- Citation display with expand/collapse
- Copy-to-clipboard for assistant answers
- Follow-up question suggestions
- Empty state with guidance

### Out of Scope

- Persistent conversation sessions across app restarts (separate feature)
- Conversation search/filter (separate feature)
- Conversation export (separate feature)

## Acceptance Criteria

1. Q&A exchanges render as chat bubbles. User messages are right-aligned in purple. Assistant messages are left-aligned in dark blue.
2. Assistant answers are shown in full. The view does not truncate the answer text.
3. Each exchange shows a compact `HH:MM` timestamp.
4. A date separator appears before the first exchange and again only when the local calendar day changes.
5. Citations start collapsed. Expanding a citation section shows document title, chunk index, and excerpt. Collapsing hides that detail.
6. Each assistant answer has a copy control. Success and failure both change the button label.
7. The latest exchange offers up to two follow-up suggestions. Choosing one calls `onFollowUp` with that question.
8. An empty history shows guidance, not a blank panel.
9. A missing response, invalid timestamp, or empty citation list does not throw.

## Verification Plan

1. Unit-test day separators, `HH:MM` formatting, suggestion selection, and citation toggle state.
2. Render the component to static markup for the empty state, bubble text, collapsed citations, follow-ups, and a malformed entry.
3. Run `npm run check`, `npm test`, and `bash scripts/check-architecture.sh`.

## Sprint Log

| Phase | Outcome |
|-------|---------|
| Implementation | Conversation history renders bubbles, full answers, `HH:MM` timestamps, local-day separators, collapsed citations, copy labels, follow-ups, and empty guidance. `npm test` (10), `npm run check`, and `bash scripts/check-architecture.sh` passed. |
