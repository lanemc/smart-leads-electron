import { render, screen, fireEvent } from '@testing-library/react';
import FileDropZone from '../renderer/components/FileDropZone';

describe('FileDropZone', () => {
  const mockOnFileDrop = jest.fn();
  const mockOnBrowseClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render drop zone with instructions', () => {
    render(
      <FileDropZone 
        onFileDrop={mockOnFileDrop}
        onBrowseClick={mockOnBrowseClick}
      />
    );

    expect(screen.getByText(/Drop CSV file here or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported format: CSV/i)).toBeInTheDocument();
  });

  it('should call onBrowseClick when clicked', () => {
    render(
      <FileDropZone 
        onFileDrop={mockOnFileDrop}
        onBrowseClick={mockOnBrowseClick}
      />
    );

    const dropZone = screen.getByText(/Drop CSV file here or click to browse/i).closest('div');
    fireEvent.click(dropZone!);

    expect(mockOnBrowseClick).toHaveBeenCalledTimes(1);
  });

  it('should handle file drop', () => {
    render(
      <FileDropZone 
        onFileDrop={mockOnFileDrop}
        onBrowseClick={mockOnBrowseClick}
      />
    );

    const dropZone = screen.getByText(/Drop CSV file here or click to browse/i).closest('div');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file],
        types: ['Files']
      }
    });

    expect(mockOnFileDrop).toHaveBeenCalledWith(file);
  });

  it('should show drag over state', () => {
    render(
      <FileDropZone 
        onFileDrop={mockOnFileDrop}
        onBrowseClick={mockOnBrowseClick}
      />
    );

    const dropZone = screen.getByText(/Drop CSV file here or click to browse/i).closest('div');

    fireEvent.dragEnter(dropZone!, {
      dataTransfer: {
        types: ['Files']
      }
    });

    // Check for visual feedback (implementation specific)
    expect(dropZone).toHaveStyle({ cursor: 'pointer' });
  });

  it('should reject non-CSV files', () => {
    render(
      <FileDropZone 
        onFileDrop={mockOnFileDrop}
        onBrowseClick={mockOnBrowseClick}
      />
    );

    const dropZone = screen.getByText(/Drop CSV file here or click to browse/i).closest('div');
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file],
        types: ['Files']
      }
    });

    expect(mockOnFileDrop).not.toHaveBeenCalled();
  });

  it('should handle multiple files by taking the first CSV', () => {
    render(
      <FileDropZone 
        onFileDrop={mockOnFileDrop}
        onBrowseClick={mockOnBrowseClick}
      />
    );

    const dropZone = screen.getByText(/Drop CSV file here or click to browse/i).closest('div');
    const csvFile = new File(['csv content'], 'test.csv', { type: 'text/csv' });
    const txtFile = new File(['txt content'], 'test.txt', { type: 'text/plain' });

    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [txtFile, csvFile],
        types: ['Files']
      }
    });

    expect(mockOnFileDrop).toHaveBeenCalledWith(csvFile);
  });
});