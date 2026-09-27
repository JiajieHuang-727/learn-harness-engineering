import { useState } from 'react';

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

interface Props {
  onImport: (filePath: string) => Promise<void>;
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return '';
  return filename.slice(dot).toLowerCase();
}

function messageFromImportError(err: unknown): string {
  const raw = err instanceof Error ? err.message : 'Import failed';
  const marker = "Error invoking remote method 'documents:import': ";
  return raw.startsWith(marker) ? raw.slice(marker.length) : raw;
}

export function ImportPanel({ onImport }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);

    const extension = extensionOf(file.name);
    if (extension !== '.txt' && extension !== '.md') {
      setError('Only .txt and .md files can be imported.');
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setError('File exceeds the 10 MB limit.');
      return;
    }

    let filePath = '';
    try {
      filePath = window.knowledgeBase.documents.pathForFile(file);
    } catch (err) {
      setError(messageFromImportError(err));
      return;
    }
    if (!filePath) {
      setError('Could not resolve a filesystem path for the selected file.');
      return;
    }

    setImporting(true);
    try {
      await onImport(filePath);
    } catch (err) {
      setError(messageFromImportError(err));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      background: '#16213e',
      borderRadius: '6px',
      border: '1px dashed #0f3460',
      textAlign: 'center',
      color: '#888',
    }}>
      <div style={{ fontSize: '14px', marginBottom: '8px' }}>Import Documents</div>
      <div style={{ fontSize: '12px' }}>
        Choose a .txt or .md file. Files over 10 MB are rejected.
      </div>
      <input
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        disabled={importing}
        onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) {
            void handleFile(file);
          }
        }}
        style={{ marginTop: '10px' }}
      />
      {importing && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#a0a0c0' }}>
          Importing...
        </div>
      )}
      {error && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#e07a7a' }}>
          {error}
        </div>
      )}
    </div>
  );
}
