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
  saveConfig: (config: any) => Promise<{
    success: boolean;
    error?: string;
  }>;
  loadConfig: () => Promise<{
    success: boolean;
    config?: any;
    error?: string;
  }>;
  deleteConfig: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  configExists: () => Promise<{
    success: boolean;
    exists?: boolean;
    error?: string;
  }>;
  validateApiKey: (apiKey: string) => Promise<{
    success: boolean;
    isValid?: boolean;
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