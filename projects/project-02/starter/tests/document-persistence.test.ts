import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { DocumentService } from '../src/services/document-service';
import { IndexingService } from '../src/services/indexing-service';
import { PersistenceService } from '../src/services/persistence-service';

describe('document persistence across restarts', () => {
  const dirs: string[] = [];

  afterEach(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    dirs.length = 0;
  });

  function openServices(root: string) {
    const dataDir = path.join(root, 'knowledge-base-data');
    const persistence = new PersistenceService(dataDir);
    return {
      documents: new DocumentService(persistence),
      indexing: new IndexingService(persistence),
    };
  }

  it('reloads imported documents and content from a new service instance', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'kb-persist-'));
    dirs.push(root);
    const source = path.join(root, 'notes.md');
    const body = '# Notes\n\nPersisted body\n';
    writeFileSync(source, body, 'utf-8');

    const first = openServices(root);
    const imported = first.documents.importDocument(source);

    const second = openServices(root);
    expect(second.documents.listDocuments()).toEqual([imported]);
    expect(second.documents.getDocumentContent(imported.id)).toBe(body);
    expect(second.indexing.getAppStatus()).toMatchObject({
      documentsLoaded: 1,
      indexStatus: 'idle',
    });

    expect(second.documents.deleteDocument(imported.id)).toBe(true);

    const third = openServices(root);
    expect(third.documents.listDocuments()).toEqual([]);
    expect(third.documents.getDocumentContent(imported.id)).toBeNull();
    expect(third.indexing.getAppStatus().documentsLoaded).toBe(0);
  });
});
