import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { DocumentService } from '../src/services/document-service';
import { PersistenceService } from '../src/services/persistence-service';

function createService(dir: string): DocumentService {
  return new DocumentService(new PersistenceService(dir));
}

describe('DocumentService in-memory import', () => {
  it('imports a markdown file and returns its content without writing the library', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-import-'));
    const source = path.join(dir, 'notes.md');
    fs.writeFileSync(source, '# Hello\n\nBody text');
    const service = createService(path.join(dir, 'data'));

    const doc = service.importDocument(source);

    expect(doc.filename).toBe('notes.md');
    expect(doc.title).toBe('notes');
    expect(doc.status).toBe('imported');
    expect(service.listDocuments()).toEqual([doc]);
    expect(service.getDocumentContent(doc.id)).toBe('# Hello\n\nBody text');
    expect(fs.existsSync(path.join(dir, 'data', 'documents-meta.json'))).toBe(false);
    expect(fs.existsSync(path.join(dir, 'data', 'content', `${doc.id}.txt`))).toBe(false);
  });

  it('rejects unsupported files and files over 10 MB without changing the library', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-reject-'));
    const pdf = path.join(dir, 'notes.pdf');
    const huge = path.join(dir, 'huge.txt');
    fs.writeFileSync(pdf, 'not a text document');
    fs.writeFileSync(huge, 'x'.repeat(10 * 1024 * 1024 + 1));
    const service = createService(path.join(dir, 'data'));

    expect(() => service.importDocument(pdf)).toThrow(/Only \.txt and \.md/);
    expect(() => service.importDocument(huge)).toThrow(/10 MB/);
    expect(service.listDocuments()).toEqual([]);
  });

  it('deletes metadata and content from memory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-delete-'));
    const source = path.join(dir, 'note.txt');
    fs.writeFileSync(source, 'temporary');
    const service = createService(path.join(dir, 'data'));
    const doc = service.importDocument(source);

    expect(service.deleteDocument(doc.id)).toBe(true);
    expect(service.getDocument(doc.id)).toBeNull();
    expect(service.getDocumentContent(doc.id)).toBeNull();
    expect(service.listDocuments()).toEqual([]);
  });
});
