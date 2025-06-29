import React, { useCallback, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface FileDropZoneProps {
  onFileDrop: (file: File) => void;
  onBrowseClick: () => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileDrop, onBrowseClick }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    // Find the first CSV file
    const csvFile = acceptedFiles.find(file => 
      file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv'
    );

    if (csvFile) {
      onFileDrop(csvFile);
    } else if (acceptedFiles.length > 0) {
      setError('Please select a CSV file');
    }
  }, [onFileDrop]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.csv']
    },
    multiple: false,
    noClick: true
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBrowseClick();
  };

  return (
    <Paper
      {...getRootProps()}
      onClick={handleClick}
      sx={{
        p: 6,
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: isDragActive 
          ? 'primary.main' 
          : isDragReject 
            ? 'error.main' 
            : 'divider',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'action.hover',
          borderColor: 'primary.light'
        }
      }}
    >
      <input {...getInputProps()} />
      
      <UploadIcon 
        sx={{ 
          fontSize: 64, 
          color: isDragActive ? 'primary.main' : 'text.secondary',
          mb: 2 
        }} 
      />
      
      <Typography variant="h6" gutterBottom>
        {isDragActive 
          ? 'Drop the CSV file here'
          : 'Drop CSV file here or click to browse'
        }
      </Typography>
      
      <Typography variant="body2" color="text.secondary">
        Supported format: CSV (.csv)
      </Typography>

      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="caption" color="text.secondary">
          The CSV should contain columns: url, snippet/description, and optionally
          contact information fields
        </Typography>
      </Box>
    </Paper>
  );
};

export default FileDropZone;