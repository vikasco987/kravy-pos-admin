const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure logging for auto-updater
log.transports.file.level = "info";
autoUpdater.logger = log;

let mainWindow;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

try {
  const { startServer } = require('./server.js');
  startServer();
} catch (e: any) {
  const fs = require('fs');
  const os = require('os');
  const logPath = path.join(os.homedir(), 'kravy_electron_error.txt');
  fs.writeFileSync(logPath, `Failed to start server: ${e?.message || e}\n\nStack: ${e?.stack}`);
  console.error("Failed to start lite server", e);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // In development, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load the built HTML file
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  // Check for updates when app is ready
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Fix for Mac/Windows bug where inputs lose keyboard focus
  app.on('browser-window-focus', (event, win) => {
    if (win) win.webContents.focus()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// IPC Handlers for React Frontend
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-name', () => app.getName());
ipcMain.handle('check-for-updates', () => autoUpdater.checkForUpdatesAndNotify());
ipcMain.handle('install-update', () => autoUpdater.quitAndInstall());

// Auto Updater Events
autoUpdater.on('update-available', (info) => {
  log.info('Update available.');
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded');
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart and Install', 'Later'],
    title: 'Application Update',
    message: 'Naya version download ho gaya hai!',
    detail: 'Kya aap app ko restart karke naya update install karna chahte hain?'
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});
autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.');
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available', info);
  }
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater. ' + err);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', err?.message || err?.toString() || 'Unknown error');
  }
});
