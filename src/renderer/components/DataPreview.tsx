import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { CSVRow } from '../../shared/types/leads';

interface DataPreviewProps {
  data: CSVRow[];
  maxRows?: number;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, maxRows = 5 }) => {
  if (data.length === 0) return null;

  // Get all unique columns from the data
  const columns = Array.from(
    new Set(data.flatMap(row => Object.keys(row)))
  ).filter(col => col !== undefined);

  // Prioritize certain columns to show first
  const priorityColumns = ['url', 'contact_name', 'contact_email', 'contact_phone', 'company_name', 'snippet', 'description'];
  const sortedColumns = [
    ...priorityColumns.filter(col => columns.includes(col)),
    ...columns.filter(col => !priorityColumns.includes(col))
  ];

  // Only show first 6 columns in preview
  const displayColumns = sortedColumns.slice(0, 6);
  const previewData = data.slice(0, maxRows);

  const truncateText = (text: string | undefined, maxLength: number = 100): string => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatColumnName = (name: string): string => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Data Preview
        </Typography>
        <Chip 
          label={`Showing ${previewData.length} of ${data.length} rows`}
          size="small"
          color="primary"
        />
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {displayColumns.map((column) => (
                <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                  {formatColumnName(column)}
                </TableCell>
              ))}
              {sortedColumns.length > displayColumns.length && (
                <TableCell sx={{ fontWeight: 'bold' }}>
                  +{sortedColumns.length - displayColumns.length} more
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {previewData.map((row, index) => (
              <TableRow key={index} hover>
                {displayColumns.map((column) => (
                  <TableCell key={column}>
                    {column === 'url' ? (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        component="a"
                        href={row[column]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {truncateText(row[column], 50)}
                      </Typography>
                    ) : column === 'contact_email' ? (
                      <Typography variant="body2" color="primary">
                        {row[column] || '-'}
                      </Typography>
                    ) : (
                      <Typography variant="body2">
                        {truncateText(row[column]) || '-'}
                      </Typography>
                    )}
                  </TableCell>
                ))}
                {sortedColumns.length > displayColumns.length && (
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      ...
                    </Typography>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {data.length > maxRows && (
        <Box mt={2} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            ... and {data.length - maxRows} more rows
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default DataPreview;