import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import path from 'path';
import { initDatabase, closeDatabase } from './database/index';
import { registerTaskHandlers } from './ipc-handlers';
import { BackupService } from './services/backup';
import { startNotificationService, stopNotificationService, checkOverdueOnStartup } from './services/notification';
import { startRecurrenceService, stopRecurrenceService } from './services/recurrence';
import { ConnectorManager } from './connectors/manager';
import { OutlookConnector } from './connectors/outlook';
import { ManualEntryConnector } from './connectors/manual';
import { createTray } from './tray';

export let connectorManager: ConnectorManager;

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

const isDev = !app.isPackaged;

function getDataPath(): string {
  if (app.isPackaged) {
    return path.join(path.dirname(app.getPath('exe')), 'data');
  }
  return path.join(process.cwd(), 'data');
}

function getMigrationsPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'migrations');
  }
  return path.join(process.cwd(), 'migrations');
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'TaskForge',
    icon: path.join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../../dist-preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for better-sqlite3 via preload
    },
    frame: true,
    show: false, // Show when ready to prevent visual flash
  });

  // Load the renderer
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist-renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Minimise to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function bootstrap(): Promise<void> {
  const dataPath = getDataPath();
  const migrationsPath = getMigrationsPath();

  // Initialise database
  initDatabase(dataPath, migrationsPath);

  // Run auto-backup
  const backupService = new BackupService(dataPath);
  backupService.runBackup();

  // Register IPC handlers
  registerTaskHandlers();

  // Register app-level IPC handlers
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:data-path', () => dataPath);

  // Create window and tray
  createWindow();
  createTray(mainWindow!, isDev, isQuitting, (val: boolean) => { isQuitting = val; });

  // Initialize connectors
  connectorManager = new ConnectorManager();
  connectorManager.register(new ManualEntryConnector());
  const outlookConnector = new OutlookConnector();
  await outlookConnector.initialize();
  connectorManager.register(outlookConnector);

  // Start notification service
  startNotificationService(mainWindow!);

  // Start recurrence service
  startRecurrenceService();

  // Check overdue tasks on startup
  const overdueCount = checkOverdueOnStartup();
  if (overdueCount > 0) {
    const notification = new Notification({
      title: 'TaskForge',
      body: `You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}`,
    });
    notification.show();
  }
}

// Single instance lock — prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  // On macOS, keep the app running in the menu bar
  if (process.platform !== 'darwin') {
    // Don't quit — tray keeps it alive
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopNotificationService();
  stopRecurrenceService();
  closeDatabase();
});
