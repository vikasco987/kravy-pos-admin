const { app, BrowserWindow } = require('electron')
const path = require('path')

let mainWindow;

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
