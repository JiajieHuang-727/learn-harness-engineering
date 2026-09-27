import { contextBridge, ipcRenderer, webUtils } from 'electron';

// A sandboxed preload cannot require other application modules, so the channel
// names are inlined here. They must match IPC_CHANNELS in src/shared/types.ts.
const channels = {
  LIST_DOCUMENTS: 'documents:list',
  IMPORT_DOCUMENT: 'documents:import',
  GET_DOCUMENT: 'documents:get',
  GET_DOCUMENT_CONTENT: 'documents:get-content',
  DELETE_DOCUMENT: 'documents:delete',
  START_INDEXING: 'indexing:start',
  GET_INDEXING_STATUS: 'indexing:status',
  GET_CHUNKS: 'indexing:chunks',
  ASK_QUESTION: 'qa:ask',
  GET_HISTORY: 'qa:history',
  GET_STATUS: 'app:status',
} as const;

const api = {
  documents: {
    list: () => ipcRenderer.invoke(channels.LIST_DOCUMENTS),
    import: (filePath: string) => ipcRenderer.invoke(channels.IMPORT_DOCUMENT, filePath),
    get: (id: string) => ipcRenderer.invoke(channels.GET_DOCUMENT, id),
    getContent: (id: string) => ipcRenderer.invoke(channels.GET_DOCUMENT_CONTENT, id),
    delete: (id: string) => ipcRenderer.invoke(channels.DELETE_DOCUMENT, id),
    pathForFile: (file: Parameters<typeof webUtils.getPathForFile>[0]) => webUtils.getPathForFile(file),
  },
  indexing: {
    start: (documentId?: string) => ipcRenderer.invoke(channels.START_INDEXING, documentId),
    status: () => ipcRenderer.invoke(channels.GET_INDEXING_STATUS),
    chunks: (documentId: string) => ipcRenderer.invoke(channels.GET_CHUNKS, documentId),
  },
  qa: {
    ask: (question: string) => ipcRenderer.invoke(channels.ASK_QUESTION, question),
    history: () => ipcRenderer.invoke(channels.GET_HISTORY),
  },
};

contextBridge.exposeInMainWorld('knowledgeBase', api);
