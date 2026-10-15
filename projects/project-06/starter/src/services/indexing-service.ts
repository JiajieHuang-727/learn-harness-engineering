import { v4 as uuidv4 } from 'uuid';
import { AppStatus, Chunk, Document } from '../shared/types';
import { DocumentService } from './document-service';
import { PersistenceService } from './persistence-service';
import { logger } from './logger';

const SERVICE = 'indexing-service';
const INDEX_META = 'index-meta.json';
const CHUNKS_DIR = 'chunks';

export class IndexingService {
  private persistence: PersistenceService;
  private documents: DocumentService;

  constructor(persistence: PersistenceService, documents: DocumentService) {
    this.persistence = persistence;
    this.documents = documents;
  }

  /** Start indexing documents. If documentId is provided, index only that document. */
  async startIndexing(documentId?: string): Promise<AppStatus> {
    if (documentId) {
      return this.indexOne(documentId);
    }
    return this.indexAll();
  }

  /** Get current indexing status in the shape the status bar reads. */
  getStatus(): AppStatus {
    const docs = this.persistence.readJson<Document[]>('documents-meta.json') ?? [];
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};
    const indexedCount = Object.keys(chunksMeta).length;
    const totalDocuments = docs.length;

    let indexStatus: AppStatus['indexStatus'] = 'idle';
    if (totalDocuments > 0 && indexedCount === totalDocuments) {
      indexStatus = 'ready';
    } else if (indexedCount > 0) {
      indexStatus = 'indexing';
    }

    const lastActivity = docs.reduce(
      (latest, doc) => (doc.importedAt > latest ? doc.importedAt : latest),
      '',
    );

    return {
      documentsLoaded: totalDocuments,
      indexStatus,
      lastActivity,
    };
  }

  private indexOne(documentId: string): AppStatus {
    const content = this.documents.getDocumentContent(documentId);
    if (!content) {
      logger.error(SERVICE, 'Content not found for document', { documentId });
      return { ...this.getStatus(), indexStatus: 'error' };
    }

    const chunks = this.chunkDocument(documentId, content);
    this.persistence.writeJson(`${CHUNKS_DIR}/${documentId}.json`, chunks);
    this.rememberChunks(documentId, chunks);
    const updated = this.documents.updateDocument(documentId, {
      status: 'indexed',
      chunks: chunks.length,
    });
    if (!updated) {
      logger.warn(SERVICE, 'Document metadata missing after indexing', { documentId });
    }

    logger.info(SERVICE, 'Single document indexed', {
      documentId,
      chunkCount: chunks.length,
    });
    return this.getStatus();
  }

  private indexAll(): AppStatus {
    const docsMeta = this.persistence.readJson<Document[]>('documents-meta.json') ?? [];
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};
    let indexedCount = 0;

    for (const doc of docsMeta) {
      if (chunksMeta[doc.id]) {
        if (doc.status !== 'indexed') {
          this.documents.updateDocument(doc.id, {
            status: 'indexed',
            chunks: chunksMeta[doc.id].length,
          });
        }
        continue;
      }

      const content = this.documents.getDocumentContent(doc.id);
      if (!content) {
        logger.warn(SERVICE, 'Content not found for document', { documentId: doc.id });
        continue;
      }

      const chunks = this.chunkDocument(doc.id, content);
      this.persistence.writeJson(`${CHUNKS_DIR}/${doc.id}.json`, chunks);
      chunksMeta[doc.id] = chunks.map(chunk => chunk.id);
      this.documents.updateDocument(doc.id, {
        status: 'indexed',
        chunks: chunks.length,
      });
      indexedCount++;
      logger.info(SERVICE, 'Document indexed', {
        documentId: doc.id,
        chunkCount: chunks.length,
      });
    }

    this.persistence.writeJson(INDEX_META, chunksMeta);
    logger.info(SERVICE, 'Batch indexing complete', {
      totalDocs: docsMeta.length,
      newlyIndexed: indexedCount,
    });
    return this.getStatus();
  }

  private rememberChunks(documentId: string, chunks: Chunk[]): void {
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};
    chunksMeta[documentId] = chunks.map(chunk => chunk.id);
    this.persistence.writeJson(INDEX_META, chunksMeta);
  }

  /** Get all chunks for a document. */
  getChunksForDocument(documentId: string): Chunk[] {
    return this.persistence.readJson<Chunk[]>(`${CHUNKS_DIR}/${documentId}.json`) ?? [];
  }

  /** Get all chunks across all documents. */
  getAllChunks(): Chunk[] {
    const chunksMeta = this.persistence.readJson<Record<string, string[]>>(INDEX_META) ?? {};
    const allChunks: Chunk[] = [];

    for (const docId of Object.keys(chunksMeta)) {
      const chunks = this.getChunksForDocument(docId);
      allChunks.push(...chunks);
    }

    return allChunks;
  }

  /** Split a document into chunks of ~500 characters at paragraph boundaries. */
  private chunkDocument(documentId: string, content: string): Chunk[] {
    const CHUNK_SIZE = 500;
    const chunks: Chunk[] = [];

    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    let buffer = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      if (buffer.length + para.length > CHUNK_SIZE && buffer.length > 0) {
        chunks.push(this.createChunk(documentId, chunkIndex++, buffer.trim()));
        buffer = para;
      } else {
        buffer += (buffer ? '\n\n' : '') + para;
      }
    }

    if (buffer.trim()) {
      chunks.push(this.createChunk(documentId, chunkIndex, buffer.trim()));
    }

    return chunks;
  }

  private createChunk(documentId: string, index: number, content: string): Chunk {
    return {
      id: uuidv4(),
      documentId,
      content,
      index,
      metadata: {
        charCount: String(content.length),
        wordCount: String(content.split(/\s+/).length),
      },
    };
  }
}
