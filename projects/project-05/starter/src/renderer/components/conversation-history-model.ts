import { Citation, QAHistory } from '../../shared/types';

export interface DisplayExchange {
  question: string;
  answer: string;
  citations: Citation[];
  timestamp: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isCitation(value: unknown): value is Citation {
  return !!value && typeof value === 'object';
}

/** Read one history row without assuming every field is present. */
export function readExchange(item: QAHistory | null | undefined): DisplayExchange {
  const response = item?.response;
  const rawCitations = response?.citations;
  return {
    question: typeof item?.question === 'string' ? item.question : '',
    answer: typeof response?.answer === 'string' ? response.answer : '',
    citations: Array.isArray(rawCitations) ? rawCitations.filter(isCitation) : [],
    timestamp: typeof response?.timestamp === 'string' ? response.timestamp : '',
  };
}

/** Local `HH:MM`, or null when the timestamp cannot be parsed. */
export function formatExchangeTime(timestamp: string): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Local calendar day as `YYYY-MM-DD`, or null when the timestamp is invalid. */
export function localDayKey(timestamp: string): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDayLabel(timestamp: string): string {
  const date = new Date(timestamp);
  if (!timestamp || Number.isNaN(date.getTime())) return 'Unknown date';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** A separator leads the thread, then appears only when the local day changes. */
export function shouldShowDateSeparator(
  isFirst: boolean,
  previousTimestamp: string,
  timestamp: string,
): boolean {
  if (isFirst) return true;
  return localDayKey(timestamp) !== localDayKey(previousTimestamp);
}

/** At most two follow-up questions derived from the latest user question. */
export function followUpSuggestions(question: string): string[] {
  const trimmed = question.trim();
  if (!trimmed) return [];
  return [
    `Can you expand on: ${trimmed}`,
    `What sources support: ${trimmed}`,
  ];
}

export function toggleCitation(open: ReadonlySet<number>, index: number): Set<number> {
  const next = new Set(open);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  return next;
}

export function copyButtonLabel(status: 'idle' | 'copied' | 'failed'): string {
  if (status === 'copied') return 'Copied';
  if (status === 'failed') return 'Copy failed';
  return 'Copy';
}
