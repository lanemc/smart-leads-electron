import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  TextField,
  MenuItem,
  Grid
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Download as DownloadIcon,
  CloudUpload as UploadIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Event as EventIcon,
  CheckCircle as QualifiedIcon,
  Cancel as RejectedIcon
} from '@mui/icons-material';
import { LeadResult, ProcessingStats, AppConfig } from '../../shared/types/leads';

interface ResultsViewProps {
  results: LeadResult[];
  stats: ProcessingStats;
  config: AppConfig;
  onExport: () => void;
  onNewImport: () => void;
}

interface FilterState {
  classification: string;
  scoreRange: string;
  hasEmail: string;
  hasPhone: string;
  searchTerm: string;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  results,
  stats,
  config,
  onExport,
  onNewImport
}) => {
  const [filters, setFilters] = useState<FilterState>({
    classification: 'all',
    scoreRange: 'all',
    hasEmail: 'all',
    hasPhone: 'all',
    searchTerm: ''
  });

  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const filteredResults = useMemo(() => {
    return results.filter(result => {
      // Classification filter
      if (filters.classification !== 'all' && result.classification !== filters.classification) {
        return false;
      }

      // Score range filter
      if (filters.scoreRange !== 'all') {
        const score = result.confidenceScore;
        switch (filters.scoreRange) {
          case 'high':
            if (score < config.scoring.thresholds.highValue) return false;
            break;
          case 'qualified':
            if (score < config.scoring.thresholds.qualified || 
                score >= config.scoring.thresholds.highValue) return false;
            break;
          case 'minimum':
            if (score < config.scoring.thresholds.minimum || 
                score >= config.scoring.thresholds.qualified) return false;
            break;
          case 'rejected':
            if (score >= config.scoring.thresholds.minimum) return false;
            break;
        }
      }

      // Email filter
      if (filters.hasEmail === 'yes' && !result.contactEmail) return false;
      if (filters.hasEmail === 'no' && result.contactEmail) return false;

      // Phone filter
      if (filters.hasPhone === 'yes' && !result.contactPhone) return false;
      if (filters.hasPhone === 'no' && result.contactPhone) return false;

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const searchableText = [
          result.contactName,
          result.contactTitle,
          result.contactEmail,
          result.companyName,
          result.url
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) return false;
      }

      return true;
    });
  }, [results, filters, config]);

  const columns: GridColDef[] = [
    {
      field: 'classification',
      headerName: 'Type',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const icons = {
          person: <PersonIcon fontSize="small" />,
          business: <BusinessIcon fontSize="small" />,
          event: <EventIcon fontSize="small" />,
          unknown: null
        };
        return (
          <Chip
            icon={icons[params.value as keyof typeof icons] || undefined}
            label={params.value}
            size="small"
            color={params.value === 'person' ? 'success' : 'default'}
          />
        );
      }
    },
    {
      field: 'contactName',
      headerName: 'Contact Name',
      width: 200,
      valueGetter: (params) => params.row.contactName || params.row.companyName || '-'
    },
    {
      field: 'contactTitle',
      headerName: 'Title',
      width: 180,
      valueGetter: (params) => params.row.contactTitle || '-'
    },
    {
      field: 'contactEmail',
      headerName: 'Email',
      width: 220,
      renderCell: (params: GridRenderCellParams) => 
        params.value ? (
          <Typography variant="body2" color="primary">
            {params.value}
          </Typography>
        ) : '-'
    },
    {
      field: 'contactPhone',
      headerName: 'Phone',
      width: 150,
      valueGetter: (params) => params.row.contactPhone || '-'
    },
    {
      field: 'companyName',
      headerName: 'Company',
      width: 200,
      valueGetter: (params) => params.row.companyName || '-'
    },
    {
      field: 'confidenceScore',
      headerName: 'Score',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const score = params.value as number;
        const color = score >= config.scoring.thresholds.highValue ? 'success' :
                     score >= config.scoring.thresholds.qualified ? 'primary' :
                     score >= config.scoring.thresholds.minimum ? 'warning' : 'error';
        return (
          <Chip
            label={score}
            size="small"
            color={color}
          />
        );
      }
    },
    {
      field: 'quality',
      headerName: 'Quality',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.value}/10
        </Typography>
      )
    },
    {
      field: 'url',
      headerName: 'Source',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          component="a"
          href={params.value as string}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          View Profile
        </Typography>
      )
    }
  ];

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const exportSelected = async () => {
    const selectedData = results.filter(r => selectedRows.includes(r.url));
    if (selectedData.length === 0) {
      onExport();
    } else {
      // Export selected rows
      const { CSVParser } = await import('../../shared/services/csv-parser');
      const csv = CSVParser.exportToCSV(selectedData);
      const result = await window.electronAPI.showSaveDialog('selected-leads.csv');
      
      if (!result.canceled && result.filePath) {
        await window.electronAPI.writeFile(result.filePath, csv);
      }
    }
  };

  const processingTime = stats.endTime 
    ? Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000)
    : 0;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Processing Complete
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Chip
                icon={<QualifiedIcon />}
                label={`Qualified: ${stats.qualified}`}
                color="success"
              />
              <Chip
                icon={<RejectedIcon />}
                label={`Rejected: ${stats.rejected}`}
                color="error"
              />
              <Chip
                label={`Time: ${processingTime}s`}
                color="default"
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={onNewImport}
              sx={{ mr: 2 }}
            >
              Import New CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportSelected}
            >
              {selectedRows.length > 0 
                ? `Export ${selectedRows.length} Selected`
                : 'Export All Qualified'
              }
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <FilterIcon />
          <Typography variant="h6">Filters</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Name, email, company..."
              size="small"
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              select
              label="Type"
              value={filters.classification}
              onChange={(e) => handleFilterChange('classification', e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="person">Person</MenuItem>
              <MenuItem value="business">Business</MenuItem>
              <MenuItem value="event">Event</MenuItem>
              <MenuItem value="unknown">Unknown</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              select
              label="Score Range"
              value={filters.scoreRange}
              onChange={(e) => handleFilterChange('scoreRange', e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Scores</MenuItem>
              <MenuItem value="high">High ({config.scoring.thresholds.highValue}+)</MenuItem>
              <MenuItem value="qualified">Qualified ({config.scoring.thresholds.qualified}-{config.scoring.thresholds.highValue-1})</MenuItem>
              <MenuItem value="minimum">Minimum ({config.scoring.thresholds.minimum}-{config.scoring.thresholds.qualified-1})</MenuItem>
              <MenuItem value="rejected">Rejected (&lt;{config.scoring.thresholds.minimum})</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              select
              label="Has Email"
              value={filters.hasEmail}
              onChange={(e) => handleFilterChange('hasEmail', e.target.value)}
              size="small"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="yes">Has Email</MenuItem>
              <MenuItem value="no">No Email</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              select
              label="Has Phone"
              value={filters.hasPhone}
              onChange={(e) => handleFilterChange('hasPhone', e.target.value)}
              size="small"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="yes">Has Phone</MenuItem>
              <MenuItem value="no">No Phone</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {filteredResults.length} results
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={filteredResults}
          columns={columns}
          getRowId={(row) => row.url}
          checkboxSelection
          onRowSelectionModelChange={(newSelection) => {
            setSelectedRows(newSelection as string[]);
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'confidenceScore', sort: 'desc' }]
            }
          }}
          pageSizeOptions={[25, 50, 100]}
        />
      </Paper>
    </Box>
  );
};

export default ResultsView;