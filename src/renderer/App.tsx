import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Alert,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  CloudUpload as UploadIcon,
  PlayArrow as ProcessIcon,
  Download as ExportIcon
} from '@mui/icons-material';
import FileDropZone from './components/FileDropZone';
import ConfigDialog from './components/ConfigDialog';
import DataPreview from './components/DataPreview';
import ProcessingDialog from './components/ProcessingDialog';
import ResultsView from './components/ResultsView';
import { CSVParser } from '../shared/services/csv-parser';
import { AppState, LeadResult, AppConfig } from '../shared/types/leads';

const defaultConfig: AppConfig = {
  openai: {
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.2
  },
  processing: {
    batchSize: 10,
    maxConcurrent: 3,
    retryAttempts: 3
  },
  scoring: {
    thresholds: {
      highValue: 80,
      qualified: 60,
      minimum: 40
    }
  }
};

function App() {
  const [state, setState] = useState<AppState>({
    status: 'idle',
    csvData: [],
    results: [],
    stats: {
      total: 0,
      processed: 0,
      qualified: 0,
      rejected: 0,
      errors: 0,
      startTime: new Date()
    },
    config: defaultConfig
  });

  const [configOpen, setConfigOpen] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup menu event listeners
  useEffect(() => {
    window.electronAPI.onMenuImportCSV(() => {
      handleImportClick();
    });

    window.electronAPI.onMenuExportResults(() => {
      handleExport();
    });

    return () => {
      window.electronAPI.removeAllListeners('menu-import-csv');
      window.electronAPI.removeAllListeners('menu-export-results');
    };
  }, []);

  const handleImportClick = async () => {
    const result = await window.electronAPI.showOpenDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      await loadCSVFile(result.filePaths[0]);
    }
  };

  const loadCSVFile = async (filePath: string) => {
    setError(null);
    setState(prev => ({ ...prev, status: 'loading' }));

    try {
      const fileResult = await window.electronAPI.readFile(filePath);
      if (!fileResult.success) {
        throw new Error(fileResult.error);
      }

      const parseResult = await CSVParser.parseContent(fileResult.content!);
      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      setState(prev => ({
        ...prev,
        status: 'idle',
        csvData: parseResult.data!,
        stats: {
          ...prev.stats,
          total: parseResult.data!.length
        }
      }));
    } catch (err) {
      setError((err as Error).message);
      setState(prev => ({ ...prev, status: 'idle' }));
    }
  };

  const handleFileDrop = async (file: File) => {
    setError(null);
    setState(prev => ({ ...prev, status: 'loading' }));

    try {
      const parseResult = await CSVParser.parseFile(file);
      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      setState(prev => ({
        ...prev,
        status: 'idle',
        csvData: parseResult.data!,
        stats: {
          ...prev.stats,
          total: parseResult.data!.length
        }
      }));
    } catch (err) {
      setError((err as Error).message);
      setState(prev => ({ ...prev, status: 'idle' }));
    }
  };

  const handleProcess = () => {
    if (!state.config.openai.apiKey) {
      setError('Please configure your OpenAI API key in settings');
      setConfigOpen(true);
      return;
    }

    setProcessingOpen(true);
    setState(prev => ({ 
      ...prev, 
      status: 'processing',
      stats: {
        ...prev.stats,
        startTime: new Date()
      }
    }));

    // Processing will be implemented in the ProcessingDialog component
  };

  const handleProcessingComplete = (results: LeadResult[]) => {
    const qualified = results.filter(r => r.confidenceScore >= state.config.scoring.thresholds.minimum);
    const rejected = results.length - qualified.length;

    setState(prev => ({
      ...prev,
      status: 'completed',
      results,
      stats: {
        ...prev.stats,
        processed: results.length,
        qualified: qualified.length,
        rejected,
        endTime: new Date()
      }
    }));
    setProcessingOpen(false);
  };

  const handleExport = async () => {
    if (state.results.length === 0) return;

    const qualified = state.results.filter(
      r => r.confidenceScore >= state.config.scoring.thresholds.minimum
    );

    const csv = CSVParser.exportToCSV(qualified);
    const result = await window.electronAPI.showSaveDialog('qualified-leads.csv');
    
    if (!result.canceled && result.filePath) {
      await window.electronAPI.writeFile(result.filePath, csv);
    }
  };

  const handleConfigSave = (config: AppConfig) => {
    setState(prev => ({ ...prev, config }));
    setConfigOpen(false);
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Smart Leads Qualifier
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => setConfigOpen(true)}
            aria-label="settings"
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {state.status === 'idle' && state.csvData.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <FileDropZone
              onFileDrop={handleFileDrop}
              onBrowseClick={handleImportClick}
            />
          </Paper>
        )}

        {state.status === 'loading' && (
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Loading CSV file...</Typography>
            <LinearProgress />
          </Paper>
        )}

        {state.csvData.length > 0 && state.status !== 'completed' && (
          <Box>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6">
                    {state.csvData.length} leads loaded
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ready to process
                  </Typography>
                </Box>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={handleImportClick}
                    sx={{ mr: 2 }}
                  >
                    Load Different File
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<ProcessIcon />}
                    onClick={handleProcess}
                    disabled={state.status === 'processing'}
                  >
                    Process Leads
                  </Button>
                </Box>
              </Box>
            </Paper>

            <DataPreview data={state.csvData} />
          </Box>
        )}

        {state.status === 'completed' && (
          <ResultsView
            results={state.results}
            stats={state.stats}
            config={state.config}
            onExport={handleExport}
            onNewImport={handleImportClick}
          />
        )}
      </Container>

      <ConfigDialog
        open={configOpen}
        config={state.config}
        onClose={() => setConfigOpen(false)}
        onSave={handleConfigSave}
      />

      <ProcessingDialog
        open={processingOpen}
        csvData={state.csvData}
        config={state.config}
        onComplete={handleProcessingComplete}
        onClose={() => setProcessingOpen(false)}
      />

      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Kansas City Royals - Lead Qualifier v1.0.0
            </Typography>
            <Box>
              {state.status === 'completed' && (
                <>
                  <Chip
                    label={`Qualified: ${state.stats.qualified}`}
                    color="success"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`Rejected: ${state.stats.rejected}`}
                    color="error"
                    size="small"
                    sx={{ mr: 2 }}
                  />
                </>
              )}
              <Button
                size="small"
                startIcon={<ExportIcon />}
                onClick={handleExport}
                disabled={state.results.length === 0}
              >
                Export Results
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default App;