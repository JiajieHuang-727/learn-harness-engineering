import { app, BrowserWindow, ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { DocumentService } from '../services/document-service';
import { QaService } from '../services/qa-service';
import { IndexingService } from '../services/indexing-service';
import { PersistenceService } from '../services/persistence-service';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: 'Knowledge Base',
  });

  // In development, load from Vite dev server or built renderer
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeServices() {
  const dataDir = path.join(app.getPath('userData'), 'knowledge-base-data');
  const persistence = new PersistenceService(dataDir);
  const documentService = new DocumentService(persistence);
  const indexingService = new IndexingService(persistence);
  const qaService = new QaService(persistence, indexingService);

  await seedSampleDocuments(documentService, indexingService);

  registerIpcHandlers(ipcMain, {
    documentService,
    indexingService,
    qaService,
  });
}

/** First launch copies the bundled samples so the list and Q&A are usable immediately. */
async function seedSampleDocuments(
  documentService: DocumentService,
  indexingService: IndexingService,
) {
  if (documentService.listDocuments().length > 0) return;

  const sampleDir = path.join(app.getAppPath(), 'data', 'sample-documents');
  if (!fs.existsSync(sampleDir)) return;

  for (const name of fs.readdirSync(sampleDir)) {
    if (!/\.(md|txt|markdown)$/i.test(name)) continue;
    const fullPath = path.join(sampleDir, name);
    if (!fs.statSync(fullPath).isFile()) continue;
    documentService.importDocument(fullPath);
  }

  await indexingService.startIndexing();
}

app.whenReady().then(async () => {
  await initializeServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
