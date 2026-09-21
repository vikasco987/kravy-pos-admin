/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    getAppVersion: () => Promise<string>;
    getAppName: () => Promise<string>;
    checkForUpdates: () => Promise<void>;
    installUpdate: () => Promise<void>;
    onUpdateAvailable: (callback: (event: any, info: any) => void) => void;
    onUpdateDownloaded: (callback: (event: any, info: any) => void) => void;
  };
}
