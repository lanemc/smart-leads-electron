export interface ElectronAPI {
  showOpenDialog: () => Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;
  showSaveDialog: (defaultFileName: string) => Promise<{
    canceled: boolean;
    filePath?: string;
  }>;
  readFile: (filePath: string) => Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }>;
  writeFile: (filePath: string, content: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  onMenuImportCSV: (callback: () => void) => void;
  onMenuExportResults: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}