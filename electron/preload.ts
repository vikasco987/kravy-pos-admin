const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency] as string)
  }
});

// Expose API to renderer
(window as any).electronAPI = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppName: () => ipcRenderer.invoke('get-app-name'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (callback: any) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback: any) => ipcRenderer.on('update-downloaded', callback),
  onUpdateNotAvailable: (callback: any) => ipcRenderer.on('update-not-available', callback),
  onUpdateError: (callback: any) => ipcRenderer.on('update-error', callback)
};
