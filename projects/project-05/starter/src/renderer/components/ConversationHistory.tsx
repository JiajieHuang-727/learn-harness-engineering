import { useEffect, useRef, useState } from 'react';
import { QAHistory } from '../../shared/types';

interface Props {
  history: QAHistory[];
  onFollowUp?: (question: string) => void;
}

/**
 * Oldest-first chat transcript for the History tab.
 * Each exchange is one user bubble and one assistant bubble.
 * Citation lists start collapsed. Follow-up suggestions render
 * only on the latest exchange and are passed through onFollowUp.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface VisibleCitation {
  documentTitle: string;
  chunkLabel: string;
  excerpt: string;
}

interface Exchange {
  question: string;
  answer: string;
  citations: VisibleCitation[];
  timestamp: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function parseLocalDate(timestamp: string): Date | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatClock(timestamp: string): string {
  const date = parseLocalDate(timestamp);
  if (!date) return '--:--';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatMonthDay(timestamp: string): string {
  const date = parseLocalDate(timestamp);
  if (!date) return 'Unknown date';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function differentLocalDay(previous: string, current: string): boolean {
  const left = parseLocalDate(previous);
  const right = parseLocalDate(current);
  if (!left || !right) return false;
  return left.getFullYear() !== right.getFullYear()
    || left.getMonth() !== right.getMonth()
    || left.getDate() !== right.getDate();
}

function normalizeCitation(value: unknown): VisibleCitation | null {
  const record = asRecord(value);
  if (!record) return null;
  const title = typeof record.documentTitle === 'string' ? record.documentTitle.trim() : '';
  const chunkIndex = record.chunkIndex;
  const excerpt = typeof record.excerpt === 'string' ? record.excerpt : '';
  return {
    documentTitle: title || 'Untitled document',
    chunkLabel: typeof chunkIndex === 'number' && Number.isFinite(chunkIndex) ? String(chunkIndex) : '—',
    excerpt,
  };
}

function normalizeExchange(item: unknown): Exchange {
  const record = asRecord(item);
  const response = asRecord(record?.response);
  const question = typeof record?.question === 'string' ? record.question : '';
  const rawCitations = response && Array.isArray(response.citations) ? response.citations : [];
  return {
    question,
    answer: response
      ? (typeof response.answer === 'string' ? response.answer : '')
      : 'Answer unavailable',
    citations: rawCitations
      .map(normalizeCitation)
      .filter((citation): citation is VisibleCitation => citation !== null),
    timestamp: response && typeof response.timestamp === 'string' ? response.timestamp : '',
  };
}

function followUpSuggestions(question: string): string[] {
  const topic = question.replace(/\s+/g, ' ').trim().replace(/[?？!！.。]+$/u, '');
  const clipped = topic.length > 42 ? `${topic.slice(0, 39).trim()}…` : topic;
  if (!clipped) {
    return [
      'What should I ask about these documents?',
      'Which document should I start with?',
    ];
  }
  return [
    `Tell me more about ${clipped}`,
    `What are the key points of ${clipped}?`,
    `Which documents mention ${clipped}?`,
  ];
}

const wrapStyle = {
  whiteSpace: 'pre-wrap' as const,
  overflowWrap: 'anywhere' as const,
};

export function ConversationHistory({ history, onFollowUp }: Props) {
  const items = (Array.isArray(history) ? history : []).map(normalizeExchange);
  const [openCitations, setOpenCitations] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    };
  }, []);

  if (items.length === 0) {
    return (
      <div style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '24px 16px',
        color: '#888',
        textAlign: 'center',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#533483" d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 3.2V5a1 1 0 0 1 1-1z" />
        </svg>
        <div style={{ fontSize: '13px', lineHeight: 1.45 }}>
          No conversation yet. Ask a question to get started.
        </div>
      </div>
    );
  }

  const copyAnswer = (index: number, answer: string) => {
    const writeText = navigator.clipboard?.writeText?.bind(navigator.clipboard);
    if (!writeText) return;
    Promise.resolve(writeText(answer)).then(() => {
      setCopiedIndex(index);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => {
        setCopiedIndex(current => (current === index ? null : current));
        copyTimer.current = null;
      }, 1600);
    }).catch(() => {
      // Keep the transcript mounted if the clipboard is unavailable.
    });
  };

  return (
    <div
      role="log"
      aria-label="Conversation history"
      style={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        overflowX: 'hidden',
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {items.map((exchange, index) => {
        const previous = index > 0 ? items[index - 1].timestamp : '';
        const showDate = index === 0 || differentLocalDay(previous, exchange.timestamp);
        const citationsOpen = openCitations[index] === true;
        const isLatest = index === items.length - 1;
        return (
          <div key={index} data-exchange={index} style={{ minWidth: 0 }}>
            {showDate && (
              <div data-date-separator style={{
                textAlign: 'center',
                fontSize: '10px',
                letterSpacing: '0.04em',
                color: '#8888bb',
                marginBottom: '8px',
              }}>
                {formatMonthDay(exchange.timestamp)}
              </div>
            )}
            <div data-role="user" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{
                maxWidth: '92%',
                background: '#533483',
                color: '#fff',
                padding: '8px 10px',
                borderRadius: '10px 10px 2px 10px',
                fontSize: '12px',
                lineHeight: 1.45,
                ...wrapStyle,
              }}>
                {exchange.question}
              </div>
            </div>
            <div data-role="assistant" style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
              <div style={{
                maxWidth: '92%',
                background: '#1a1a3e',
                color: '#e0e0e0',
                padding: '8px 10px',
                borderRadius: '10px 10px 10px 2px',
                fontSize: '12px',
                lineHeight: 1.45,
                minWidth: 0,
              }}>
                <div style={wrapStyle}>{exchange.answer}</div>
                {exchange.citations.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      data-citations
                      aria-expanded={citationsOpen}
                      onClick={() => setOpenCitations(current => ({
                        ...current,
                        [index]: !current[index],
                      }))}
                      style={{
                        background: 'transparent',
                        color: '#b8b8dd',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      {citationsOpen
                        ? 'Hide citations'
                        : `${exchange.citations.length} citation${exchange.citations.length === 1 ? '' : 's'}`}
                    </button>
                    {citationsOpen && (
                      <div data-citation-list style={{ marginTop: '6px' }}>
                        {exchange.citations.map((citation, citationIndex) => (
                          <div key={citationIndex} style={{
                            marginTop: citationIndex === 0 ? 0 : '8px',
                            paddingLeft: '8px',
                            borderLeft: '2px solid #533483',
                            color: '#c8c8e0',
                            fontSize: '11px',
                          }}>
                            <div>{citation.documentTitle}</div>
                            <div>Chunk {citation.chunkLabel}</div>
                            <div style={wrapStyle}>{citation.excerpt}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  data-copy
                  onClick={() => copyAnswer(index, exchange.answer)}
                  style={{
                    marginTop: '8px',
                    background: '#0f3460',
                    color: '#e0e0e0',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  {copiedIndex === index ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div data-timestamp style={{
              marginTop: '4px',
              textAlign: 'center',
              fontSize: '10px',
              color: '#888',
            }}>
              {formatClock(exchange.timestamp)}
            </div>
            {isLatest && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                {followUpSuggestions(exchange.question).map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    data-follow-up
                    onClick={() => onFollowUp?.(suggestion)}
                    style={{
                      textAlign: 'left',
                      background: 'transparent',
                      color: '#d5c7ee',
                      border: '1px solid #533483',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      lineHeight: 1.35,
                      cursor: 'pointer',
                      ...wrapStyle,
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
