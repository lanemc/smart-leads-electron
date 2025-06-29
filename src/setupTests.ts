import '@testing-library/jest-dom';

// Mock electron API for tests
global.window.electronAPI = {
  showOpenDialog: jest.fn(),
  showSaveDialog: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  saveConfig: jest.fn(),
  loadConfig: jest.fn(),
  deleteConfig: jest.fn(),
  configExists: jest.fn(),
  validateApiKey: jest.fn(),
  onMenuImportCSV: jest.fn(),
  onMenuExportResults: jest.fn(),
  removeAllListeners: jest.fn()
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn()
};