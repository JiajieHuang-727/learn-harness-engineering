import { useState } from 'react';
import { Citation, QAHistory } from '../../shared/types';
import {
  copyButtonLabel,
  followUpSuggestions,
  formatDayLabel,
  formatExchangeTime,
  readExchange,
  shouldShowDateSeparator,
  toggleCitation,
} from './conversation-history-model';

interface Props {
  history: QAHistory[];
  onFollowUp?: (question: string) => void;
}

function citationText(citation: Citation) {
  return {
    title: typeof citation.documentTitle === 'string' && citation.documentTitle
      ? citation.documentTitle
      : 'Untitled document',
    chunkIndex: typeof citation.chunkIndex === 'number' ? String(citation.chunkIndex) : '—',
    excerpt: typeof citation.excerpt === 'string' ? citation.excerpt : '',
  };
}

/**
 * Multi-turn Q&A history. User bubbles sit on the right in purple.
 * Assistant bubbles sit on the left in dark blue, with the full answer.
 */
export function ConversationHistory({ history, onFollowUp }: Props) {
  const entries = Array.isArray(history) ? history : [];
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [copyStatus, setCopyStatus] = useState<Record<number, 'idle' | 'copied' | 'failed'>>({});

  if (entries.length === 0) {
    return (
      <div
        data-role="empty-state"
        style={{
          flex: 1,
          padding: '40px 20px',
          color: '#666',
          textAlign: 'center',
          fontSize: '13px',
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '8px' }} aria-hidden="true">&#128172;</div>
        <div style={{ fontWeight: 600, marginBottom: '6px', color: '#c0c0d8' }}>
          No conversation yet
        </div>
        <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
          Ask a question about your documents. Each exchange will show up here with its answer and citations.
        </div>
      </div>
    );
  }

  const copyAnswer = async (index: number, answer: string) => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(answer);
      setCopyStatus(prev => ({ ...prev, [index]: 'copied' }));
    } catch {
      setCopyStatus(prev => ({ ...prev, [index]: 'failed' }));
    }
  };

  return (
    <div
      data-role="conversation-history"
      style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '8px' }}
    >
      {entries.map((item, index) => {
        const exchange = readExchange(item);
        const previous = index > 0 ? readExchange(entries[index - 1]).timestamp : '';
        const showSeparator = shouldShowDateSeparator(index === 0, previous, exchange.timestamp);
        const clock = formatExchangeTime(exchange.timestamp);
        const citationsOpen = expanded.has(index);
        const suggestions = index === entries.length - 1
          ? followUpSuggestions(exchange.question)
          : [];

        return (
          <div key={index} data-role="exchange" style={{ marginBottom: '12px' }}>
            {showSeparator && (
              <div
                data-role="date-separator"
                data-day={exchange.timestamp}
                style={{
                  textAlign: 'center',
                  fontSize: '10px',
                  color: '#888',
                  margin: '8px 0',
                }}
              >
                {formatDayLabel(exchange.timestamp)}
              </div>
            )}

            <div data-align="end" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
              <div
                data-role="user-message"
                style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  background: '#533483',
                  color: '#fff',
                  borderRadius: '12px 12px 2px 12px',
                  fontSize: '12px',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {exchange.question}
              </div>
            </div>

            <div data-align="start" style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                data-role="assistant-message"
                style={{
                  maxWidth: '85%',
                  padding: '10px 12px',
                  background: '#0f3460',
                  color: '#e0e0e0',
                  borderRadius: '12px 12px 12px 2px',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {exchange.answer}

                {exchange.citations.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      data-role="citation-toggle"
                      aria-expanded={citationsOpen}
                      onClick={() => setExpanded(prev => toggleCitation(prev, index))}
                      style={{
                        fontSize: '10px',
                        color: '#c5d4f0',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 0',
                      }}
                    >
                      {citationsOpen ? 'Hide citations' : `Citations (${exchange.citations.length})`}
                    </button>
                    {citationsOpen && exchange.citations.map((citation, citationIndex) => {
                      const detail = citationText(citation);
                      return (
                        <div
                          key={citationIndex}
                          data-role="citation"
                          style={{
                            marginTop: '4px',
                            padding: '4px 8px',
                            borderLeft: '2px solid #7c6bb5',
                            fontSize: '10px',
                            color: '#d0d0e8',
                          }}
                        >
                          <div>{detail.title}</div>
                          <div>Chunk {detail.chunkIndex}</div>
                          <div>{detail.excerpt}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ marginTop: '6px' }}>
                  <button
                    type="button"
                    data-role="copy"
                    onClick={() => { void copyAnswer(index, exchange.answer); }}
                    style={{
                      fontSize: '10px',
                      color: '#d0d0e8',
                      background: 'none',
                      border: '1px solid #1a4a7a',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: '2px 6px',
                    }}
                  >
                    {copyButtonLabel(copyStatus[index] ?? 'idle')}
                  </button>
                </div>
              </div>
            </div>

            {clock && (
              <div
                data-role="timestamp"
                style={{ fontSize: '10px', color: '#888', textAlign: 'right', marginTop: '2px' }}
              >
                {clock}
              </div>
            )}

            {suggestions.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                {suggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    data-role="follow-up"
                    onClick={() => onFollowUp?.(suggestion)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '11px',
                      color: '#d8d8f0',
                      background: '#1a1a2e',
                      border: '1px solid #0f3460',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      marginBottom: '4px',
                      cursor: 'pointer',
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
