import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../shared/types';
import { PersistenceService } from './persistence-service';

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.txt', '.md']);

export class DocumentService {
  private readonly documents: Document[] = [];
  private readonly contents = new Map<string, string>();

  constructor(persistence: PersistenceService) {
    // Injected for the later persistence session. Import does not write through it yet.
    void persistence;
  }

  /** List documents imported in this process. */
  listDocuments(): Document[] {
    return this.documents.map(doc => ({ ...doc }));
  }

  /**
   * Import a .txt or .md file from the given path.
   * Metadata and text stay in memory. Nothing is written to the data directory.
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

    this.documents.push(doc);
    this.contents.set(doc.id, content);
    return { ...doc };
  }

  /** Get a single document by ID. */
  getDocument(id: string): Document | null {
    const doc = this.documents.find(item => item.id === id);
    return doc ? { ...doc } : null;
  }

  /** Get the text content of a document held in memory. */
  getDocumentContent(id: string): string | null {
    if (!this.documents.some(item => item.id === id)) return null;
    return this.contents.get(id) ?? null;
  }

  /** Update a document's metadata in memory. */
  updateDocument(id: string, updates: Partial<Document>): Document | null {
    const index = this.documents.findIndex(item => item.id === id);
    if (index === -1) return null;

    const next: Document = { ...this.documents[index], ...updates, id };
    this.documents[index] = next;
    return { ...next };
  }

  /** Delete a document from the in-memory library. */
  deleteDocument(id: string): boolean {
    const index = this.documents.findIndex(item => item.id === id);
    if (index === -1) return false;

    this.documents.splice(index, 1);
    this.contents.delete(id);
    return true;
  }
}
