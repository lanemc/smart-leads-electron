import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../renderer/App';

// Mock the electron API
const mockElectronAPI = {
  showOpenDialog: jest.fn(),
  showSaveDialog: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  onMenuImportCSV: jest.fn(),
  onMenuExportResults: jest.fn(),
  removeAllListeners: jest.fn()
};

beforeEach(() => {
  window.electronAPI = mockElectronAPI;
  jest.clearAllMocks();
});

describe('App', () => {
  it('should render the main application', () => {
    render(<App />);
    
    expect(screen.getByText(/Smart Leads Qualifier/i)).toBeInTheDocument();
    expect(screen.getByText(/Drop CSV file here or click to browse/i)).toBeInTheDocument();
  });

  it('should show file dialog when clicking browse button', async () => {
    mockElectronAPI.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/path/to/file.csv']
    });
    
    mockElectronAPI.readFile.mockResolvedValue({
      success: true,
      content: 'url,snippet\\nhttps://example.com,Test content'
    });

    render(<App />);
    
    const dropZone = screen.getByText(/Drop CSV file here or click to browse/i);
    fireEvent.click(dropZone);

    await waitFor(() => {
      expect(mockElectronAPI.showOpenDialog).toHaveBeenCalled();
    });
  });

  it('should display error for invalid CSV', async () => {
    mockElectronAPI.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/path/to/file.csv']
    });
    
    mockElectronAPI.readFile.mockResolvedValue({
      success: true,
      content: 'invalid,csv\\nmissing,url'
    });

    render(<App />);
    
    const dropZone = screen.getByText(/Drop CSV file here or click to browse/i);
    fireEvent.click(dropZone);

    await waitFor(() => {
      expect(screen.getByText(/must contain a "url" column/i)).toBeInTheDocument();
    });
  });

  it('should show preview of loaded CSV data', async () => {
    mockElectronAPI.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/path/to/file.csv']
    });
    
    mockElectronAPI.readFile.mockResolvedValue({
      success: true,
      content: 'url,snippet,contact_name\\nhttps://example.com,John is the CEO,John Doe'
    });

    render(<App />);
    
    const dropZone = screen.getByText(/Drop CSV file here or click to browse/i);
    fireEvent.click(dropZone);

    await waitFor(() => {
      expect(screen.getByText(/1 leads loaded/i)).toBeInTheDocument();
      expect(screen.getByText(/Process Leads/i)).toBeInTheDocument();
    });
  });

  it('should show configuration dialog when clicking settings', async () => {
    render(<App />);
    
    const settingsButton = screen.getByLabelText(/settings/i);
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText(/Configuration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/OpenAI API Key/i)).toBeInTheDocument();
    });
  });

  it('should handle menu import CSV event', async () => {
    render(<App />);
    
    // Simulate menu event
    const menuCallback = mockElectronAPI.onMenuImportCSV.mock.calls[0][0];
    
    mockElectronAPI.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/path/to/file.csv']
    });
    
    mockElectronAPI.readFile.mockResolvedValue({
      success: true,
      content: 'url,snippet\\nhttps://example.com,Test content'
    });

    menuCallback();

    await waitFor(() => {
      expect(mockElectronAPI.showOpenDialog).toHaveBeenCalled();
    });
  });

  it('should show processing progress', async () => {
    mockElectronAPI.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/path/to/file.csv']
    });
    
    mockElectronAPI.readFile.mockResolvedValue({
      success: true,
      content: 'url,snippet\\nhttps://example.com,Test content'
    });

    render(<App />);
    
    const dropZone = screen.getByText(/Drop CSV file here or click to browse/i);
    fireEvent.click(dropZone);

    await waitFor(() => {
      expect(screen.getByText(/Process Leads/i)).toBeInTheDocument();
    });

    // Click process button
    const processButton = screen.getByText(/Process Leads/i);
    fireEvent.click(processButton);

    expect(screen.getByText(/Processing/i)).toBeInTheDocument();
  });

  it('should enable export after processing', async () => {
    // This test would be expanded once processing is implemented
    render(<App />);
    
    // Initially export should be disabled
    const exportButton = screen.getByText(/Export Results/i);
    expect(exportButton).toBeDisabled();
  });

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = render(<App />);
    
    unmount();
    
    expect(mockElectronAPI.removeAllListeners).toHaveBeenCalledWith('menu-import-csv');
    expect(mockElectronAPI.removeAllListeners).toHaveBeenCalledWith('menu-export-results');
  });
});