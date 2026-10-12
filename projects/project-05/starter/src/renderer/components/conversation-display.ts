import { QAHistory } from '../../shared/types';

export function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseTimestamp(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Local calendar day key, used to decide when a date separator is needed. */
export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDayLabel(date: Date, today = new Date()): string {
  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  });
}

export function needsDateSeparator(
  current: Date | null,
  previous: Date | null,
): boolean {
  if (!current) return false;
  if (!previous) return true;
  return dayKey(current) !== dayKey(previous);
}

export function toggleExpanded(current: ReadonlySet<number>, index: number): Set<number> {
  const next = new Set(current);
  if (next.has(index)) {
    next.delete(index);
  } else {
    next.add(index);
  }
  return next;
}

export function previewExcerpt(excerpt: string, limit = 160): string {
  const text = excerpt.trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}…`;
}

export function buildFollowUpSuggestions(question: string): string[] {
  const normalized = question.toLowerCase();

  if (/(design|architecture|pattern|layer|preload)/.test(normalized)) {
    return [
      'What design patterns are used in the services layer?',
      'How does the preload bridge keep the renderer isolated?',
    ];
  }

  if (/(import|document|file)/.test(normalized)) {
    return [
      'What file formats can be imported?',
      'Where are imported documents stored?',
    ];
  }

  if (/(index|chunk|search|retrieval|query)/.test(normalized)) {
    return [
      'What chunk size does indexing use?',
      'How are matching chunks ranked?',
    ];
  }

  return [
    'How does document indexing work?',
    'Which documents are available to search?',
  ];
}

export async function copyAnswerText(
  text: string,
  writeText?: (value: string) => Promise<void>,
  execCopy?: (value: string) => boolean,
): Promise<boolean> {
  if (writeText) {
    try {
      await writeText(text);
      return true;
    } catch {
      // Fall through to the synchronous copy path.
    }
  }

  if (!execCopy) return false;

  try {
    return execCopy(text);
  } catch {
    return false;
  }
}

export function answerText(item: QAHistory): string {
  return item.response?.answer ?? '';
}
