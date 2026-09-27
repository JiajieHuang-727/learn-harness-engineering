import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../shared/types';
import { PersistenceService } from './persistence-service';

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.txt', '.md']);
const DOCUMENTS_META = 'documents-meta.json';
const INDEX_META = 'index-meta.json';

export class DocumentService {
  private persistence: PersistenceService;

  constructor(persistence: PersistenceService) {
    this.persistence = persistence;
  }

  /** List documents stored in documents-meta.json. */
  listDocuments(): Document[] {
    const docs = this.persistence.readJson<Document[]>(DOCUMENTS_META) ?? [];
    return docs.map(doc => ({ ...doc }));
  }

  /**
   * Import a .txt or .md file from the given path.
   * Copies the source file, writes extracted text, and appends metadata.
   */
  importDocument(filePath: string): Document {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      throw new Error(`File not found: ${filePath}`);
    }

    const filename = path.basename(filePath);
    const extension = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new Error('Only .txt and .md files can be imported');
    }
    if (stats.size > MAX_IMPORT_BYTES) {
      throw new Error('File exceeds the 10 MB limit');
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const title = filename.replace(/\.[^.]+$/, '') || filename;
    const doc: Document = {
      id: uuidv4(),
      title,
      filename,
      importedAt: new Date().toISOString(),
      size: stats.size,
      status: 'imported',
    };

    this.persistence.copyFileToDocuments(filePath, filename);
    this.persistence.writeText(`content/${doc.id}.txt`, content);

    const docs = this.listDocuments();
    docs.push(doc);
    this.persistence.writeJson(DOCUMENTS_META, docs);
    return { ...doc };
  }

  /** Get a single document by ID. */
  getDocument(id: string): Document | null {
    const doc = this.listDocuments().find(item => item.id === id);
    return doc ? { ...doc } : null;
  }

  /** Get the extracted text stored for a document. */
  getDocumentContent(id: string): string | null {
    if (!this.listDocuments().some(item => item.id === id)) return null;
    return this.persistence.readText(`content/${id}.txt`);
  }

  /** Update a document's metadata and write it back. */
  updateDocument(id: string, updates: Partial<Document>): Document | null {
    const docs = this.listDocuments();
    const index = docs.findIndex(item => item.id === id);
    if (index === -1) return null;

    const next: Document = { ...docs[index], ...updates, id };
    docs[index] = next;
    this.persistence.writeJson(DOCUMENTS_META, docs);
    return { ...next };
  }

  /**
   * Delete a document and its stored files.
   * Removes the copied source, extracted text, chunks, and index entry.
   */
  deleteDocument(id: string): boolean {
    const docs = this.listDocuments();
    const doc = docs.find(item => item.id === id);
    if (!doc) return false;

    this.persistence.deleteFromDocuments(doc.filename);
    this.persistence.deleteFile(`content/${id}.txt`);
    this.persistence.deleteFile(`chunks/${id}.json`);

    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META);
    if (chunksMeta && Object.prototype.hasOwnProperty.call(chunksMeta, id)) {
      delete chunksMeta[id];
      this.persistence.writeJson(INDEX_META, chunksMeta);
    }

    this.persistence.writeJson(
      DOCUMENTS_META,
      docs.filter(item => item.id !== id),
    );
    return true;
  }
}
