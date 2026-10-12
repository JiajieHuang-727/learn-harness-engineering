import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Citation, QAHistory } from '../../shared/types';
import { ConversationHistory } from './ConversationHistory';
import {
  followUpSuggestions,
  formatExchangeTime,
  localDayKey,
  shouldShowDateSeparator,
  toggleCitation,
} from './conversation-history-model';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const morning = new Date(2026, 9, 12, 9, 5);
const evening = new Date(2026, 9, 12, 18, 40);
const nextMorning = new Date(2026, 9, 13, 8, 1);

function exchange(question: string, answer: string, timestamp: Date, citations: Citation[] = []): QAHistory {
  return {
    question,
    response: {
      answer,
      citations,
      confidence: 0.8,
      timestamp: timestamp.toISOString(),
    },
  };
}

describe('conversation history formatting', () => {
  it('formats local time as HH:MM', () => {
    expect(formatExchangeTime(morning.toISOString())).toBe('09:05');
    expect(formatExchangeTime(evening.toISOString())).toBe('18:40');
    expect(formatExchangeTime('not-a-timestamp')).toBeNull();
    expect(formatExchangeTime('')).toBeNull();
  });

  it('places a date separator first and again only when the local day changes', () => {
    expect(localDayKey(morning.toISOString())).toBe(localDayKey(evening.toISOString()));
    expect(localDayKey(nextMorning.toISOString())).not.toBe(localDayKey(evening.toISOString()));

    expect(shouldShowDateSeparator(true, '', morning.toISOString())).toBe(true);
    expect(shouldShowDateSeparator(false, morning.toISOString(), evening.toISOString())).toBe(false);
    expect(shouldShowDateSeparator(false, evening.toISOString(), nextMorning.toISOString())).toBe(true);
    expect(shouldShowDateSeparator(false, 'not-a-timestamp', 'also-bad')).toBe(false);
  });

  it('builds at most two follow-up suggestions from the question', () => {
    expect(followUpSuggestions('How does indexing work?')).toEqual([
      'Can you expand on: How does indexing work?',
      'What sources support: How does indexing work?',
    ]);
    expect(followUpSuggestions('   ')).toEqual([]);
  });

  it('toggles citation open state closed by default', () => {
    const closed = new Set<number>();
    const open = toggleCitation(closed, 0);
    expect(open.has(0)).toBe(true);
    expect(closed.has(0)).toBe(false);
    expect(toggleCitation(open, 0).has(0)).toBe(false);
    expect(toggleCitation(open, 1).has(1)).toBe(true);
  });
});

describe('ConversationHistory static markup', () => {
  const citation: Citation = {
    documentId: 'doc-1',
    documentTitle: 'Design Notes',
    chunkIndex: 3,
    excerpt: 'SECRET_EXCERPT_42 layered architecture boundaries',
  };
  const longAnswer = 'The indexing pipeline keeps every word of this answer visible. '.repeat(8);

  it('renders empty guidance, full bubbles, collapsed citations, and latest follow-ups', () => {
    const empty = renderToStaticMarkup(
      <ConversationHistory history={[]} onFollowUp={() => undefined} />,
    );
    expect(empty).toContain('data-role="empty-state"');
    expect(empty).toContain('No conversation yet');
    expect(empty).toContain('Ask a question about your documents');
    expect(empty.trim().length).toBeGreaterThan(0);

    const history = [
      exchange('alpha topic', 'first answer', morning),
      exchange('beta topic', longAnswer, evening, [citation]),
    ];
    const html = renderToStaticMarkup(
      <ConversationHistory history={history} onFollowUp={() => undefined} />,
    );

    expect(html).toContain('alpha topic');
    expect(html).toContain(longAnswer);
    expect(html).not.toContain(`${longAnswer.slice(0, 80)}...`);
    expect(html).toContain('#533483');
    expect(html).toContain('flex-end');
    expect(html).toContain('#0f3460');
    expect(html).toContain('flex-start');
    expect(html).toContain('09:05');
    expect(html).toContain('18:40');
    expect(html).toContain('Oct 12, 2026');
    expect(html.match(/data-role="date-separator"/g)).toHaveLength(1);

    expect(html).toContain('Citations (1)');
    expect(html).not.toContain('SECRET_EXCERPT_42');
    expect(html).not.toContain('Design Notes');
    expect(html).toContain('Can you expand on: beta topic');
    expect(html).toContain('What sources support: beta topic');
    expect(html).not.toContain('Can you expand on: alpha topic');
    expect(html.match(/data-role="follow-up"/g)).toHaveLength(2);
  });

  it('renders a day separator again only after the local calendar day changes', () => {
    const html = renderToStaticMarkup(
      <ConversationHistory
        history={[
          exchange('same day morning', 'answer one', morning),
          exchange('same day evening', 'answer two', evening),
          exchange('next day', 'answer three', nextMorning),
        ]}
        onFollowUp={() => undefined}
      />,
    );
    expect(html.match(/data-role="date-separator"/g)).toHaveLength(2);
    expect(html).toContain('Oct 12, 2026');
    expect(html).toContain('Oct 13, 2026');
    expect(html).toContain('08:01');
  });

  it('renders a malformed entry without throwing', () => {
    const malformed = [
      { question: 'missing response' },
      {
        question: 'bad time',
        response: {
          answer: 'still here in full',
          citations: [],
          confidence: 0,
          timestamp: 'not-a-timestamp',
        },
      },
      {
        question: 'empty cites',
        response: {
          answer: 'no citations attached',
          citations: [],
          confidence: 1,
          timestamp: morning.toISOString(),
        },
      },
    ] as QAHistory[];

    expect(() => renderToStaticMarkup(
      <ConversationHistory history={malformed} onFollowUp={() => undefined} />,
    )).not.toThrow();

    const html = renderToStaticMarkup(
      <ConversationHistory history={malformed} onFollowUp={() => undefined} />,
    );
    expect(html).toContain('missing response');
    expect(html).toContain('still here in full');
    expect(html).toContain('Unknown date');
    expect(html).toContain('no citations attached');
    expect(html).not.toContain('Citations');
  });
});

describe('ConversationHistory interactions', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    container?.remove();
    root = null;
    container = null;
  });

  function mount(history: QAHistory[], onFollowUp: (question: string) => void = () => undefined) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root?.render(<ConversationHistory history={history} onFollowUp={onFollowUp} />);
    });
    return container;
  }

  it('expands and collapses citation details', () => {
    const view = mount([
      exchange('Where is the design?', 'See the notes.', morning, [{
        documentId: 'doc-1',
        documentTitle: 'Design Notes',
        chunkIndex: 3,
        excerpt: 'SECRET_EXCERPT_42',
      }]),
    ]);
    expect(view.textContent).not.toContain('SECRET_EXCERPT_42');
    const toggle = view.querySelector('[data-role="citation-toggle"]') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    act(() => {
      toggle.click();
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(view.textContent).toContain('Design Notes');
    expect(view.textContent).toContain('Chunk 3');
    expect(view.textContent).toContain('SECRET_EXCERPT_42');

    act(() => {
      toggle.click();
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(view.textContent).not.toContain('SECRET_EXCERPT_42');
    expect(view.textContent).not.toContain('Design Notes');
  });

  it('calls onFollowUp with the chosen suggestion', () => {
    const onFollowUp = vi.fn();
    const view = mount([
      exchange('How does indexing work?', 'Chunks of about 500 characters.', morning),
    ], onFollowUp);
    const buttons = view.querySelectorAll('[data-role="follow-up"]');
    expect(buttons).toHaveLength(2);

    act(() => {
      (buttons[1] as HTMLButtonElement).click();
    });
    expect(onFollowUp).toHaveBeenCalledTimes(1);
    expect(onFollowUp).toHaveBeenCalledWith('What sources support: How does indexing work?');
  });

  it('changes the copy label on success and on failure', async () => {
    const writeText = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const view = mount([exchange('Copy me', 'Full answer text', morning)]);
    const button = view.querySelector('[data-role="copy"]') as HTMLButtonElement;
    expect(button.textContent).toBe('Copy');

    await act(async () => {
      button.click();
    });
    expect(button.textContent).toBe('Copied');
    expect(writeText).toHaveBeenCalledWith('Full answer text');

    await act(async () => {
      button.click();
    });
    expect(button.textContent).toBe('Copy failed');
  });
});
