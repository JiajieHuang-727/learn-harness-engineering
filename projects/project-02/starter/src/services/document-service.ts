import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../shared/types';
import { PersistenceService } from './persistence-service';

const DOCUMENTS_META = 'documents-meta.json';
const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Set(['.txt', '.md']);

export class DocumentService {
  private persistence: PersistenceService;

  constructor(persistence: PersistenceService) {
    this.persistence = persistence;
  }

  /** List all imported documents. */
  listDocuments(): Document[] {
    const docs = this.persistence.readJson<Document[]>(DOCUMENTS_META);
    return docs ?? [];
  }

  /** Import a .txt or .md file from the given path. Rejects other types and files over 10 MB. */
  importDocument(filePath: string): Document {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new Error(`Not a file: ${filePath}`);
    }

    const filename = path.basename(filePath);
    const extension = path.extname(filename).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      throw new Error(
        `Unsupported file type "${extension || '(none)'}". Only .txt and .md files can be imported.`,
      );
    }
    if (stats.size > MAX_IMPORT_BYTES) {
      throw new Error(
        `File is too large (${(stats.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is 10 MB.`,
      );
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    const doc: Document = {
      id: uuidv4(),
      title: filename.replace(/\.[^.]+$/, ''),
      filename,
      importedAt: new Date().toISOString(),
      size: stats.size,
      status: 'imported',
    };

    // Copy file to data directory
    this.persistence.copyFileToDocuments(filePath, filename);

    // Store content for indexing
    this.persistence.writeText(`content/${doc.id}.txt`, content);

    // Update metadata
    const docs = this.listDocuments();
    docs.push(doc);
    this.persistence.writeJson(DOCUMENTS_META, docs);

    return doc;
  }

  /** Get a single document by ID. */
  getDocument(id: string): Document | null {
    const docs = this.listDocuments();
    return docs.find(d => d.id === id) ?? null;
  }

  /** Get the text content of a document. */
  getDocumentContent(id: string): string | null {
    return this.persistence.readText(`content/${id}.txt`);
  }

  /** Update a document's metadata. */
  updateDocument(id: string, updates: Partial<Document>): Document | null {
    const docs = this.listDocuments();
    const index = docs.findIndex(d => d.id === id);
    if (index === -1) return null;

    docs[index] = { ...docs[index], ...updates };
    this.persistence.writeJson(DOCUMENTS_META, docs);
    return docs[index];
  }

  /** Delete a document by ID. */
  deleteDocument(id: string): boolean {
    const docs = this.listDocuments();
    const doc = docs.find(d => d.id === id);
    if (!doc) return false;

    this.persistence.deleteFromDocuments(doc.filename);
    this.persistence.deleteFile(`content/${id}.txt`);
    this.persistence.deleteFile(`chunks/${id}.json`);

    const indexMeta = this.persistence.readJson<Record<string, string[]>>('index-meta.json');
    if (indexMeta && id in indexMeta) {
      delete indexMeta[id];
      this.persistence.writeJson('index-meta.json', indexMeta);
    }

    const updated = docs.filter(d => d.id !== id);
    this.persistence.writeJson(DOCUMENTS_META, updated);
    return true;
  }
}
