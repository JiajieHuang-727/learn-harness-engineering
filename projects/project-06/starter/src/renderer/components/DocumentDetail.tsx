import { useEffect, useState } from 'react';
import { Document, Chunk } from '../../shared/types';

interface Props {
  document: Document;
  onChange: () => void | Promise<void>;
}

export function DocumentDetail({ document, onChange }: Props) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [showChunks, setShowChunks] = useState(false);
  const [indexing, setIndexing] = useState(false);

  useEffect(() => {
    let active = true;
    window.knowledgeBase.indexing.chunks(document.id).then((next) => {
      if (active) setChunks(next);
    });
    return () => {
      active = false;
    };
  }, [document.id, document.status, document.chunks]);

  const handleIndex = async () => {
    setIndexing(true);
    try {
      await window.knowledgeBase.indexing.start(document.id);
      await onChange();
    } catch (err) {
      console.error('Indexing failed:', err);
    } finally {
      setIndexing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${document.title}"? This cannot be undone.`)) return;
    try {
      await window.knowledgeBase.documents.delete(document.id);
      await onChange();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
        {document.title}
      </h2>
      <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
        <div>Filename: {document.filename}</div>
        <div>Imported: {new Date(document.importedAt).toLocaleString()}</div>
        <div>Size: {(document.size / 1024).toFixed(1)} KB</div>
        <div>Status: {document.status}</div>
        {document.chunks !== undefined && <div>Chunks: {document.chunks}</div>}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setShowChunks(!showChunks)}
          style={{
            padding: '6px 12px',
            background: '#0f3460',
            color: '#e0e0e0',
            border: '1px solid #1a1a4e',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          {showChunks ? 'Hide' : 'Show'} Chunks ({chunks.length})
        </button>
        {document.status !== 'indexed' && (
          <button
            onClick={() => { void handleIndex(); }}
            disabled={indexing}
            style={{
              padding: '6px 12px',
              background: indexing ? '#333' : '#533483',
              color: indexing ? '#888' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: indexing ? 'not-allowed' : 'pointer',
              fontSize: '12px',
            }}
          >
            {indexing ? 'Indexing...' : 'Index Document'}
          </button>
        )}
        <button
          onClick={() => { void handleDelete(); }}
          style={{
            padding: '6px 12px',
            background: '#d9534f',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Delete
        </button>
      </div>

      {showChunks && (
        <div>
          {chunks.map(chunk => (
            <div
              key={chunk.id}
              style={{
                padding: '10px',
                marginBottom: '8px',
                background: '#1a1a3e',
                borderRadius: '4px',
                borderLeft: '3px solid #533483',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                Chunk {chunk.index} ({chunk.metadata.charCount} chars)
              </div>
              {chunk.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
