import { Tray, Menu, nativeImage, app, BrowserWindow, NativeImage } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export function createTray(
  mainWindow: BrowserWindow,
  isDev: boolean,
  _isQuitting: boolean,
  setQuitting: (val: boolean) => void
): void {
  const iconPath = isDev
    ? path.join(process.cwd(), 'resources', 'tray-icon.png')
    : path.join(process.resourcesPath, 'resources', 'tray-icon.png');

  // Create a simple tray icon — if the icon file doesn't exist yet,
  // create a 16x16 placeholder
  let trayIcon: NativeImage;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('TaskForge');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show TaskForge',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Quick Add Task',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
        mainWindow?.webContents.send('trigger:quick-add');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit TaskForge',
      click: () => {
        setQuitting(true);
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}
