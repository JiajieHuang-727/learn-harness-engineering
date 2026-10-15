import { BrowserWindow, dialog, IpcMain, OpenDialogOptions, WebContents } from 'electron';
import { DocumentService } from '../services/document-service';
import { IndexingService } from '../services/indexing-service';
import { QaService } from '../services/qa-service';
import { IPC_CHANNELS } from '../shared/types';
import { logger } from '../services/logger';

const SERVICE = 'ipc-handlers';

export interface Services {
  documentService: DocumentService;
  indexingService: IndexingService;
  qaService: QaService;
}

export function registerIpcHandlers(ipcMain: IpcMain, services: Services) {
  const { documentService, indexingService, qaService } = services;

  // Document operations
  ipcMain.handle(IPC_CHANNELS.LIST_DOCUMENTS, async () => {
    logger.debug(SERVICE, 'IPC: LIST_DOCUMENTS');
    return documentService.listDocuments();
  });

  ipcMain.handle(IPC_CHANNELS.IMPORT_DOCUMENT, async (event, filePath?: string) => {
    const resolvedPath = filePath || await pickDocument(event.sender);
    if (!resolvedPath) {
      logger.info(SERVICE, 'IPC: IMPORT_DOCUMENT canceled');
      return null;
    }
    logger.info(SERVICE, 'IPC: IMPORT_DOCUMENT', { filePath: resolvedPath });
    return documentService.importDocument(resolvedPath);
  });

  ipcMain.handle(IPC_CHANNELS.GET_DOCUMENT, async (_event, id: string) => {
    logger.debug(SERVICE, 'IPC: GET_DOCUMENT', { id });
    return documentService.getDocument(id);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_DOCUMENT, async (_event, id: string) => {
    logger.info(SERVICE, 'IPC: DELETE_DOCUMENT', { id });
    return documentService.deleteDocument(id);
  });

  // Indexing
  ipcMain.handle(IPC_CHANNELS.START_INDEXING, async (_event, documentId?: string) => {
    logger.info(SERVICE, 'IPC: START_INDEXING', { documentId: documentId ?? 'all' });
    return indexingService.startIndexing(documentId);
  });

  ipcMain.handle(IPC_CHANNELS.GET_INDEXING_STATUS, async () => {
    logger.debug(SERVICE, 'IPC: GET_INDEXING_STATUS');
    return indexingService.getStatus();
  });

  ipcMain.handle(IPC_CHANNELS.GET_CHUNKS, async (_event, documentId: string) => {
    logger.debug(SERVICE, 'IPC: GET_CHUNKS', { documentId });
    return indexingService.getChunksForDocument(documentId);
  });

  // Q&A
  ipcMain.handle(IPC_CHANNELS.ASK_QUESTION, async (_event, question: string) => {
    logger.info(SERVICE, 'IPC: ASK_QUESTION', { question });
    return qaService.ask(question);
  });

  ipcMain.handle(IPC_CHANNELS.GET_HISTORY, async () => {
    logger.debug(SERVICE, 'IPC: GET_HISTORY');
    return qaService.getHistory();
  });

  ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, async () => {
    logger.info(SERVICE, 'IPC: CLEAR_HISTORY');
    return qaService.clearHistory();
  });

  logger.info(SERVICE, 'All IPC handlers registered');
}

async function pickDocument(sender: WebContents): Promise<string | null> {
  const parent = BrowserWindow.fromWebContents(sender) ?? undefined;
  const options: OpenDialogOptions = {
    title: 'Import a document',
    properties: ['openFile'],
    filters: [{ name: 'Documents', extensions: ['txt', 'md'] }],
  };
  const picked = parent
    ? await dialog.showOpenDialog(parent, options)
    : await dialog.showOpenDialog(options);
  if (picked.canceled || picked.filePaths.length === 0) return null;
  return picked.filePaths[0];
}
