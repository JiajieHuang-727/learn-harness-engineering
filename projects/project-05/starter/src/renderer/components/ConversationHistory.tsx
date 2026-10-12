import { useState, type CSSProperties } from 'react';
import { Citation, QAHistory } from '../../shared/types';
import {
  answerText,
  buildFollowUpSuggestions,
  copyAnswerText,
  dayKey,
  formatClock,
  formatDayLabel,
  needsDateSeparator,
  parseTimestamp,
  previewExcerpt,
  toggleExpanded,
} from './conversation-display';

interface Props {
  history: QAHistory[];
  onSelect?: (item: QAHistory) => void;
  onFollowUp?: (question: string) => void;
  initialExpanded?: ReadonlyArray<number>;
}

export function ConversationHistory({ history, onSelect, onFollowUp, initialExpanded }: Props) {
  const [expandedCitations, setExpandedCitations] = useState<Set<number>>(
    () => new Set(initialExpanded ?? []),
  );
  const [copyState, setCopyState] = useState<Record<number, 'copied' | 'failed'>>({});

  if (history.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          color: '#666',
          textAlign: 'center',
        }}
      >
        <div aria-hidden="true" style={{ fontSize: '28px', marginBottom: '8px' }}>
          &#128172;
        </div>
        <div style={{ fontWeight: 600, marginBottom: '6px', color: '#c8c8d8' }}>
          No conversation yet
        </div>
        <p style={{ fontSize: '12px', lineHeight: 1.5, maxWidth: '220px' }}>
          Ask a question about your documents. Answers, citations, and follow-up
          suggestions will show up here.
        </p>
      </div>
    );
  }

  const copyAnswer = (text: string, index: number) => {
    const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    void copyAnswerText(
      text,
      clipboard ? (value) => clipboard.writeText(value) : undefined,
      (value) => fallbackCopy(value),
    ).then((ok) => {
      setCopyState((prev) => ({ ...prev, [index]: ok ? 'copied' : 'failed' }));
      window.setTimeout(() => {
        setCopyState((prev) => {
          if (prev[index] == null) return prev;
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }, 1500);
    });
  };

  return (
    <div
      role="log"
      aria-label="Conversation history"
      style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '8px' }}
    >
      {history.map((item, index) => {
        const currentTime = parseTimestamp(item.response?.timestamp);
        const previousTime = index > 0
          ? parseTimestamp(history[index - 1].response?.timestamp)
          : null;
        const showDate = needsDateSeparator(currentTime, previousTime);
        const citations = item.response?.citations ?? [];
        const expanded = expandedCitations.has(index);
        const suggestions = index === history.length - 1 && onFollowUp
          ? buildFollowUpSuggestions(item.question)
          : [];
        const confidence = item.response?.confidence;

        return (
          <article key={`${item.response?.timestamp ?? 'entry'}-${index}`} style={{ marginBottom: '12px' }}>
            {showDate && currentTime && (
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#888', margin: '8px 0', position: 'relative' }}>
                <span
                  data-date-separator={dayKey(currentTime)}
                  style={{ background: '#16213e', padding: '0 8px', position: 'relative', zIndex: 1 }}
                >
                  {formatDayLabel(currentTime)}
                </span>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#0f3460' }} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
              <QuestionBubble question={item.question} onSelect={onSelect ? () => onSelect(item) : undefined} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 12px',
                  background: '#1a1a3e',
                  color: '#e0e0e0',
                  borderRadius: '12px 12px 12px 2px',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  overflowWrap: 'anywhere',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {answerText(item) || 'No answer was returned for this question.'}

                {citations.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setExpandedCitations((current) => toggleExpanded(current, index))}
                      style={{
                        fontSize: '11px',
                        color: '#b0b0dd',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {expanded ? 'Hide' : 'Show'} {citations.length} citation{citations.length === 1 ? '' : 's'}
                    </button>
                    {expanded && (
                      <div style={{ marginTop: '6px' }}>
                        {citations.map((citation, citationIndex) => (
                          <CitationCard key={`${citation.documentId}-${citation.chunkIndex}-${citationIndex}`} citation={citation} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginTop: '8px',
                  borderTop: '1px solid #0f3460',
                  paddingTop: '6px',
                }}>
                  <button
                    type="button"
                    onClick={() => copyAnswer(answerText(item), index)}
                    aria-label="Copy answer"
                    style={{
                      fontSize: '11px',
                      color: copyState[index] === 'failed' ? '#e07070' : '#c8c8e0',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {copyLabel(copyState[index])}
                  </button>
                  {typeof confidence === 'number' && Number.isFinite(confidence) && (
                    <span style={{ fontSize: '10px', color: '#888' }}>
                      Confidence {Math.round(confidence * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '10px', color: '#777', textAlign: 'right', marginTop: '4px' }}>
              {currentTime ? formatClock(currentTime) : 'Time unavailable'}
            </div>

            {suggestions.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                  Suggested follow-ups
                </div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onFollowUp?.(suggestion)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      fontSize: '11px',
                      color: '#d0d0ea',
                      background: '#1a1a2e',
                      border: '1px solid #0f3460',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function QuestionBubble({ question, onSelect }: { question: string; onSelect?: () => void }) {
  const style: CSSProperties = {
    maxWidth: '85%',
    padding: '8px 12px',
    background: '#533483',
    color: '#fff',
    border: 'none',
    borderRadius: '12px 12px 2px 12px',
    fontSize: '12px',
    lineHeight: 1.45,
    textAlign: 'left',
    cursor: onSelect ? 'pointer' : 'default',
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
  };

  if (!onSelect) {
    return <div style={style}>{question}</div>;
  }

  return (
    <button type="button" onClick={onSelect} aria-label={`Show answer for: ${question}`} style={style}>
      {question}
    </button>
  );
}

function CitationCard({ citation }: { citation: Citation }) {
  return (
    <div style={{
      fontSize: '11px',
      color: '#b8b8cc',
      padding: '6px 8px',
      marginTop: '4px',
      borderLeft: '2px solid #533483',
      background: '#161636',
      borderRadius: '0 4px 4px 0',
      whiteSpace: 'normal',
    }}>
      <div style={{ color: '#d8d8f0', fontWeight: 600 }}>
        {citation.documentTitle || 'Untitled document'}
        <span style={{ color: '#888', fontWeight: 400 }}> · chunk {citation.chunkIndex}</span>
      </div>
      <div style={{ marginTop: '2px' }}>{previewExcerpt(citation.excerpt || '')}</div>
    </div>
  );
}

function copyLabel(state: 'copied' | 'failed' | undefined): string {
  if (state === 'copied') return 'Copied';
  if (state === 'failed') return 'Copy failed';
  return 'Copy';
}

function fallbackCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(area);
  return ok;
}
