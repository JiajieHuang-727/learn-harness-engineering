import { dialog, IpcMain } from 'electron';
import { DocumentService } from '../services/document-service';
import { IndexingService } from '../services/indexing-service';
import { QaService } from '../services/qa-service';
import { AppStatus, IPC_CHANNELS } from '../shared/types';

export interface Services {
  documentService: DocumentService;
  indexingService: IndexingService;
  qaService: QaService;
}

export function registerIpcHandlers(ipcMain: IpcMain, services: Services) {
  const { documentService, indexingService, qaService } = services;

  // Document operations
  ipcMain.handle(IPC_CHANNELS.LIST_DOCUMENTS, async () => {
    return documentService.listDocuments();
  });

  ipcMain.handle(IPC_CHANNELS.IMPORT_DOCUMENT, async (_event, filePath?: string) => {
    let target = filePath;
    if (!target) {
      const result = await dialog.showOpenDialog({
        title: 'Import a document',
        properties: ['openFile'],
        filters: [
          { name: 'Documents', extensions: ['txt', 'md', 'markdown'] },
        ],
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      target = result.filePaths[0];
    }

    const doc = documentService.importDocument(target);
    await indexingService.startIndexing(doc.id);
    return documentService.getDocument(doc.id);
  });

  ipcMain.handle(IPC_CHANNELS.GET_DOCUMENT, async (_event, id: string) => {
    return documentService.getDocument(id);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_DOCUMENT, async (_event, id: string) => {
    return documentService.deleteDocument(id);
  });

  // Indexing
  ipcMain.handle(IPC_CHANNELS.START_INDEXING, async (_event, documentId?: string) => {
    await indexingService.startIndexing(documentId);
    return toAppStatus(documentService, indexingService);
  });

  ipcMain.handle(IPC_CHANNELS.GET_INDEXING_STATUS, async () => {
    return toAppStatus(documentService, indexingService);
  });

  ipcMain.handle(IPC_CHANNELS.GET_STATUS, async () => {
    return toAppStatus(documentService, indexingService);
  });

  ipcMain.handle(IPC_CHANNELS.GET_CHUNKS, async (_event, documentId: string) => {
    return indexingService.getChunksForDocument(documentId);
  });

  // Q&A
  ipcMain.handle(IPC_CHANNELS.ASK_QUESTION, async (_event, question: string) => {
    return qaService.ask(question);
  });

  ipcMain.handle(IPC_CHANNELS.GET_HISTORY, async () => {
    return qaService.getHistory();
  });
}

function toAppStatus(documentService: DocumentService, indexingService: IndexingService): AppStatus {
  const index = indexingService.getStatus();
  return {
    documentsLoaded: documentService.listDocuments().length,
    indexStatus: index.status,
    lastActivity: index.lastIndexed ?? '',
  };
}
