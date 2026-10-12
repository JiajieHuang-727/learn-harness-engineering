import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { QAHistory } from '../../shared/types';
import { ConversationHistory } from './ConversationHistory';
import { dayKey, parseTimestamp } from './conversation-display';

function item(
  question: string,
  timestamp: string,
  answer: string,
  citations: QAHistory['response']['citations'] = [],
): QAHistory {
  return {
    question,
    response: {
      answer,
      citations,
      confidence: 0.85,
      timestamp,
    },
  };
}

describe('ConversationHistory', () => {
  it('shows guidance when there is no history', () => {
    const html = renderToStaticMarkup(<ConversationHistory history={[]} />);
    expect(html).toContain('No conversation yet');
    expect(html).toContain('Ask a question about your documents');
  });

  it('renders both sides of an exchange without truncating the answer', () => {
    const answer = 'A'.repeat(240);
    const html = renderToStaticMarkup(
      <ConversationHistory
        history={[item('How does indexing work?', '2026-09-29T01:05:00.000Z', answer)]}
        onFollowUp={() => undefined}
      />,
    );

    expect(html).toContain('How does indexing work?');
    expect(html).toContain(answer);
    expect(html).toContain('Conversation history');
    expect(html).toContain('Copy');
    expect(html).toContain('Confidence 85%');
    expect(html).toContain('Suggested follow-ups');
    expect(html).toContain('What chunk size does indexing use?');
  });

  it('keeps citations collapsed until expanded', () => {
    const html = renderToStaticMarkup(
      <ConversationHistory
        history={[item('Where is the design?', '2026-09-29T02:00:00.000Z', 'Layered.', [
          {
            documentId: 'doc-1',
            documentTitle: 'Design Notes',
            chunkIndex: 3,
            excerpt: 'The services layer owns business logic.',
          },
        ])]}
      />,
    );

    expect(html).toContain('Show 1 citation');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('Design Notes');
    expect(html).not.toContain('The services layer owns business logic.');
  });

  it('shows citation title, chunk, and excerpt when that exchange starts expanded', () => {
    const longExcerpt = `The services layer owns business logic. ${'detail '.repeat(40)}`;
    const html = renderToStaticMarkup(
      <ConversationHistory
        initialExpanded={[0]}
        history={[item('Where is the design?', '2026-09-29T02:00:00.000Z', 'Layered.', [
          {
            documentId: 'doc-1',
            documentTitle: 'Design Notes',
            chunkIndex: 3,
            excerpt: longExcerpt,
          },
        ])]}
      />,
    );

    expect(html).toContain('Hide 1 citation');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('Design Notes');
    expect(html).toContain('chunk 3');
    expect(html).toContain('…');
    expect(html).not.toContain(longExcerpt);
  });

  it('separates exchanges that fall on different local days', () => {
    const first = '2026-09-29T12:00:00.000Z';
    const second = '2026-09-30T12:00:00.000Z';
    const html = renderToStaticMarkup(
      <ConversationHistory
        history={[
          item('First', first, 'One'),
          item('Second', second, 'Two'),
        ]}
        onFollowUp={() => undefined}
      />,
    );

    expect(html).toContain(`data-date-separator="${dayKey(parseTimestamp(first)!)}"`);
    expect(html).toContain(`data-date-separator="${dayKey(parseTimestamp(second)!)}"`);
    expect(html.indexOf('Suggested follow-ups')).toBeGreaterThan(html.indexOf('Second'));
  });

  it('shows one date separator when both exchanges are on the same local day', () => {
    const html = renderToStaticMarkup(
      <ConversationHistory
        history={[
          item('Morning', '2026-09-29T02:00:00.000Z', 'One'),
          item('Later', '2026-09-29T03:00:00.000Z', 'Two'),
        ]}
      />,
    );

    expect(html.match(/data-date-separator=/g)).toHaveLength(1);
  });

  it('does not crash when an entry has no response', () => {
    const html = renderToStaticMarkup(
      <ConversationHistory history={[{ question: 'Broken entry' } as QAHistory]} />,
    );
    expect(html).toContain('Broken entry');
    expect(html).toContain('No answer was returned for this question.');
    expect(html).toContain('Time unavailable');
  });
});
