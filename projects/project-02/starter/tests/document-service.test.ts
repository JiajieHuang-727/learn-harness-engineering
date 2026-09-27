import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { DocumentService } from '../src/services/document-service';
import { PersistenceService } from '../src/services/persistence-service';

function createService(dir: string): DocumentService {
  return new DocumentService(new PersistenceService(dir));
}

describe('DocumentService persistence', () => {
  it('imports a markdown file and writes metadata, content, and a source copy', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-import-'));
    const source = path.join(dir, 'notes.md');
    const dataDir = path.join(dir, 'data');
    fs.writeFileSync(source, '# Hello\n\nBody text');
    const service = createService(dataDir);

    const doc = service.importDocument(source);

    expect(doc.filename).toBe('notes.md');
    expect(doc.title).toBe('notes');
    expect(doc.status).toBe('imported');
    expect(service.listDocuments()).toEqual([doc]);
    expect(service.getDocumentContent(doc.id)).toBe('# Hello\n\nBody text');
    expect(fs.readFileSync(path.join(dataDir, 'content', `${doc.id}.txt`), 'utf-8')).toBe(
      '# Hello\n\nBody text',
    );
    expect(fs.readFileSync(path.join(dataDir, 'documents', 'notes.md'), 'utf-8')).toBe(
      '# Hello\n\nBody text',
    );

    const meta = JSON.parse(fs.readFileSync(path.join(dataDir, 'documents-meta.json'), 'utf-8'));
    expect(meta).toEqual([doc]);
  });

  it('reloads the library from disk in a new service instance', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-reload-'));
    const source = path.join(dir, 'notes.txt');
    const dataDir = path.join(dir, 'data');
    fs.writeFileSync(source, 'saved across restart');
    const first = createService(dataDir);
    const doc = first.importDocument(source);

    const reloaded = createService(dataDir);

    expect(reloaded.listDocuments()).toEqual([doc]);
    expect(reloaded.getDocument(doc.id)).toEqual(doc);
    expect(reloaded.getDocumentContent(doc.id)).toBe('saved across restart');
  });

  it('rejects unsupported files and files over 10 MB without changing the library', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-reject-'));
    const pdf = path.join(dir, 'notes.pdf');
    const huge = path.join(dir, 'huge.txt');
    const dataDir = path.join(dir, 'data');
    fs.writeFileSync(pdf, 'not a text document');
    fs.writeFileSync(huge, 'x'.repeat(10 * 1024 * 1024 + 1));
    const service = createService(dataDir);

    expect(() => service.importDocument(pdf)).toThrow(/Only \.txt and \.md/);
    expect(() => service.importDocument(huge)).toThrow(/10 MB/);
    expect(service.listDocuments()).toEqual([]);
    expect(fs.existsSync(path.join(dataDir, 'documents-meta.json'))).toBe(false);
    expect(fs.existsSync(path.join(dataDir, 'documents', 'notes.pdf'))).toBe(false);
    expect(fs.existsSync(path.join(dataDir, 'documents', 'huge.txt'))).toBe(false);
  });

  it('deletes metadata, content, the source copy, and index files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-delete-'));
    const source = path.join(dir, 'note.txt');
    const dataDir = path.join(dir, 'data');
    fs.writeFileSync(source, 'temporary');
    const persistence = new PersistenceService(dataDir);
    const service = new DocumentService(persistence);
    const doc = service.importDocument(source);
    persistence.writeJson(`chunks/${doc.id}.json`, [{ id: 'chunk-1' }]);
    persistence.writeJson('index-meta.json', { [doc.id]: ['chunk-1'], other: ['keep'] });

    expect(service.deleteDocument(doc.id)).toBe(true);
    expect(service.getDocument(doc.id)).toBeNull();
    expect(service.getDocumentContent(doc.id)).toBeNull();
    expect(service.listDocuments()).toEqual([]);
    expect(fs.existsSync(path.join(dataDir, 'content', `${doc.id}.txt`))).toBe(false);
    expect(fs.existsSync(path.join(dataDir, 'documents', 'note.txt'))).toBe(false);
    expect(fs.existsSync(path.join(dataDir, 'chunks', `${doc.id}.json`))).toBe(false);
    expect(persistence.readJson('index-meta.json')).toEqual({ other: ['keep'] });

    const reloaded = new DocumentService(new PersistenceService(dataDir));
    expect(reloaded.listDocuments()).toEqual([]);
  });
});
