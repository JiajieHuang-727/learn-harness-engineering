import { useRef, useState } from 'react';

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

interface Props {
  onImport: (filePath: string) => Promise<void>;
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

export function ImportPanel({ onImport }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function importFile(file: File) {
    const extension = extensionOf(file.name);
    if (extension !== '.txt' && extension !== '.md') {
      setError('Only .txt and .md files are supported.');
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setError('File exceeds the 10 MB limit.');
      return;
    }

    const filePath = window.knowledgeBase.getPathForFile(file);
    if (!filePath) {
      setError('Could not resolve a filesystem path for that file.');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await onImport(filePath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed.';
      setError(message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div
      onDragOver={event => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) void importFile(file);
      }}
      style={{
        padding: '20px',
        background: '#16213e',
        borderRadius: '6px',
        border: dragging ? '1px dashed #e0e0e0' : '1px dashed #0f3460',
        textAlign: 'center',
        color: '#888',
      }}
    >
      <div style={{ fontSize: '14px', marginBottom: '8px' }}>Import Documents</div>
      <div style={{ fontSize: '12px' }}>
        Choose a file or drag one here.
        <br />
        Supported: .txt, .md files up to 10 MB
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        disabled={busy}
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) void importFile(file);
        }}
        style={{ marginTop: '10px' }}
      />
      {busy && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#a0a0c0' }}>Importing...</div>
      )}
      {error && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#e07070' }}>{error}</div>
      )}
    </div>
  );
}
