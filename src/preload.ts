import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  showSaveDialog: (defaultFileName: string) => ipcRenderer.invoke('show-save-dialog', defaultFileName),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),

  // Configuration management
  saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  deleteConfig: () => ipcRenderer.invoke('delete-config'),
  configExists: () => ipcRenderer.invoke('config-exists'),
  validateApiKey: (apiKey: string) => ipcRenderer.invoke('validate-api-key', apiKey),

  // Menu events
  onMenuImportCSV: (callback: () => void) => {
    ipcRenderer.on('menu-import-csv', callback);
  },
  onMenuExportResults: (callback: () => void) => {
    ipcRenderer.on('menu-export-results', callback);
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});