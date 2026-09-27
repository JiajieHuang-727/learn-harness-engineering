import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { DocumentService } from './document-service';
import { PersistenceService } from './persistence-service';

const tempDirs: string[] = [];

function createService() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-import-'));
  tempDirs.push(dataDir);
  return new DocumentService(new PersistenceService(dataDir));
}

function writeTempFile(name: string, content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-src-'));
  tempDirs.push(dir);
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('DocumentService import and content', () => {
  it('imports a markdown file and returns its full content', () => {
    const service = createService();
    const source = writeTempFile('design-notes.md', '# Notes\n\nParagraph one.');

    const doc = service.importDocument(source);

    expect(doc.filename).toBe('design-notes.md');
    expect(doc.title).toBe('design-notes');
    expect(doc.status).toBe('imported');
    expect(service.listDocuments().map(item => item.id)).toEqual([doc.id]);
    expect(service.getDocumentContent(doc.id)).toBe('# Notes\n\nParagraph one.');
  });

  it('rejects unsupported extensions and files over 10 MB', () => {
    const service = createService();
    const pdf = writeTempFile('notes.pdf', 'not a document');
    const huge = writeTempFile('huge.txt', 'x'.repeat(10 * 1024 * 1024 + 1));

    expect(() => service.importDocument(pdf)).toThrow(/Only \.txt and \.md/);
    expect(() => service.importDocument(huge)).toThrow(/10 MB/);
    expect(service.listDocuments()).toEqual([]);
  });

  it('restores imported documents after a new service instance is created', () => {
    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-persist-'));
    tempDirs.push(dataDir);
    const first = new DocumentService(new PersistenceService(dataDir));
    const source = writeTempFile('meeting-summary.txt', 'Team discussed retrieval.\n');

    const doc = first.importDocument(source);

    const restarted = new DocumentService(new PersistenceService(dataDir));
    expect(restarted.listDocuments()).toEqual([doc]);
    expect(restarted.getDocument(doc.id)).toEqual(doc);
    expect(restarted.getDocumentContent(doc.id)).toBe('Team discussed retrieval.\n');
    expect(fs.existsSync(path.join(dataDir, 'documents-meta.json'))).toBe(true);
    expect(fs.readdirSync(dataDir).some(name => name.endsWith('.tmp'))).toBe(false);

    expect(restarted.deleteDocument(doc.id)).toBe(true);
    const afterDelete = new DocumentService(new PersistenceService(dataDir));
    expect(afterDelete.listDocuments()).toEqual([]);
    expect(afterDelete.getDocumentContent(doc.id)).toBeNull();
  });
});
