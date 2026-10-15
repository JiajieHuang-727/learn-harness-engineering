import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../shared/types';
import { PersistenceService } from './persistence-service';
import { logger } from './logger';

const SERVICE = 'document-service';
const DOCUMENTS_META = 'documents-meta.json';
const INDEX_META = 'index-meta.json';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export class DocumentService {
  private persistence: PersistenceService;

  constructor(persistence: PersistenceService) {
    this.persistence = persistence;
  }

  /** List all imported documents. */
  listDocuments(): Document[] {
    const docs = this.persistence.readJson<Document[]>(DOCUMENTS_META);
    logger.debug(SERVICE, 'Listing documents', { count: docs?.length ?? 0 });
    return docs ?? [];
  }

  /** Import a file from the given path. */
  importDocument(filePath: string): Document {
    if (!fs.existsSync(filePath)) {
      logger.error(SERVICE, 'File not found', { filePath });
      throw new Error(`File not found: ${filePath}`);
    }

    const filename = path.basename(filePath);
    const extension = path.extname(filename).toLowerCase();
    if (extension !== '.txt' && extension !== '.md') {
      logger.error(SERVICE, 'Unsupported file type', { filePath, extension });
      throw new Error(`Unsupported file type: ${filename}. Only .txt and .md files can be imported.`);
    }

    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_BYTES) {
      logger.error(SERVICE, 'File exceeds 10MB size limit', { filePath, sizeBytes: stats.size });
      throw new Error(`File too large: ${filename}. Maximum size is 10 MB.`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    const doc: Document = {
      id: uuidv4(),
      title: titleFromContent(filename, content),
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

    logger.info(SERVICE, 'Document imported', {
      documentId: doc.id,
      filename: doc.filename,
      size: doc.size,
    });
    return doc;
  }

  /** Get a single document by ID. */
  getDocument(id: string): Document | null {
    const docs = this.listDocuments();
    const doc = docs.find(d => d.id === id) ?? null;
    if (!doc) {
      logger.warn(SERVICE, 'Document not found', { documentId: id });
    }
    return doc;
  }

  /** Get the text content of a document. */
  getDocumentContent(id: string): string | null {
    return this.persistence.readText(`content/${id}.txt`);
  }

  /** Update a document's metadata. */
  updateDocument(id: string, updates: Partial<Document>): Document | null {
    const docs = this.listDocuments();
    const index = docs.findIndex(d => d.id === id);
    if (index === -1) {
      logger.warn(SERVICE, 'Cannot update document because it was not found', { documentId: id });
      return null;
    }

    docs[index] = { ...docs[index], ...updates };
    this.persistence.writeJson(DOCUMENTS_META, docs);
    logger.info(SERVICE, 'Document updated', { documentId: id, fields: Object.keys(updates) });
    return docs[index];
  }

  /** Delete a document and the files created for it. */
  deleteDocument(id: string): boolean {
    const docs = this.listDocuments();
    const doc = docs.find(d => d.id === id);
    if (!doc) {
      logger.warn(SERVICE, 'Cannot delete document because it was not found', { documentId: id });
      return false;
    }

    this.persistence.deleteFromDocuments(doc.filename);
    this.persistence.deleteFile(`content/${id}.txt`);
    this.persistence.deleteFile(`chunks/${id}.json`);

    const index = this.persistence.readJson<Record<string, string[]>>(INDEX_META);
    if (index && Object.prototype.hasOwnProperty.call(index, id)) {
      delete index[id];
      this.persistence.writeJson(INDEX_META, index);
    }

    const updated = docs.filter(d => d.id !== id);
    this.persistence.writeJson(DOCUMENTS_META, updated);
    logger.info(SERVICE, 'Document deleted', {
      documentId: id,
      filename: doc.filename,
      remaining: updated.length,
    });
    return true;
  }
}

function titleFromContent(filename: string, content: string): string {
  const heading = content.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return filename.replace(/\.[^.]+$/, '');
}
