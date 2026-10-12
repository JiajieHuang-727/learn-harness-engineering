import { describe, expect, it } from 'vitest';
import { QAHistory } from '../../shared/types';
import {
  answerText,
  buildFollowUpSuggestions,
  copyAnswerText,
  dayKey,
  formatClock,
  needsDateSeparator,
  parseTimestamp,
  previewExcerpt,
  toggleExpanded,
} from './conversation-display';

function entry(question: string, iso: string, answer = 'Because the index says so.'): QAHistory {
  return {
    question,
    response: {
      answer,
      citations: [],
      confidence: 0.85,
      timestamp: iso,
    },
  };
}

describe('conversation display helpers', () => {
  it('formats timestamps as 24-hour HH:MM', () => {
    const date = new Date(2026, 8, 29, 9, 5);
    expect(formatClock(date)).toBe('09:05');
  });

  it('rejects invalid timestamps', () => {
    expect(parseTimestamp(undefined)).toBeNull();
    expect(parseTimestamp('not-a-date')).toBeNull();
  });

  it('inserts a date separator only when the local day changes', () => {
    const morning = new Date(2026, 8, 29, 9, 0);
    const evening = new Date(2026, 8, 29, 21, 30);
    const nextDay = new Date(2026, 8, 30, 8, 0);

    expect(needsDateSeparator(morning, null)).toBe(true);
    expect(needsDateSeparator(evening, morning)).toBe(false);
    expect(needsDateSeparator(nextDay, evening)).toBe(true);
    expect(dayKey(morning)).toBe('2026-09-29');
    expect(needsDateSeparator(null, morning)).toBe(false);
  });

  it('toggles citation expansion for one exchange without clearing the others', () => {
    const once = toggleExpanded(new Set<number>(), 1);
    expect([...once]).toEqual([1]);
    const twice = toggleExpanded(once, 1);
    expect(twice.has(1)).toBe(false);
    const other = toggleExpanded(once, 0);
    expect(other.has(0)).toBe(true);
    expect(other.has(1)).toBe(true);
  });

  it('keeps short excerpts and truncates long ones', () => {
    expect(previewExcerpt('short note')).toBe('short note');
    const long = 'a'.repeat(180);
    expect(previewExcerpt(long).endsWith('…')).toBe(true);
    expect(previewExcerpt(long).length).toBeLessThan(long.length);
  });

  it('picks follow-ups from the question topic', () => {
    expect(buildFollowUpSuggestions('How does the architecture work?')[0]).toMatch(/services layer/);
    expect(buildFollowUpSuggestions('Can I import a file?')[0]).toMatch(/file formats/);
    expect(buildFollowUpSuggestions('How are chunks ranked?')[1]).toMatch(/ranked/);
    expect(buildFollowUpSuggestions('hello')).toHaveLength(2);
  });

  it('copies through the async clipboard and falls back when that fails', async () => {
    const written: string[] = [];
    await expect(copyAnswerText('alpha', async (value) => {
      written.push(value);
    })).resolves.toBe(true);
    expect(written).toEqual(['alpha']);

    await expect(copyAnswerText('beta', async () => {
      throw new Error('denied');
    }, (value) => value === 'beta')).resolves.toBe(true);

    await expect(copyAnswerText('gamma')).resolves.toBe(false);
  });

  it('reads an answer without throwing when the response is missing', () => {
    const broken = { question: 'Where?' } as QAHistory;
    expect(answerText(broken)).toBe('');
    expect(answerText(entry('Q', '2026-09-29T01:02:00.000Z', 'Full answer text'))).toBe('Full answer text');
  });
});
