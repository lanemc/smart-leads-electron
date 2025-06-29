import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Error as ErrorIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { CSVRow, LeadResult, AppConfig } from '../../shared/types/leads';
import { ContactExtractor } from '../../shared/services/contact-extractor';
import { OpenAIService } from '../../shared/services/openai-service';

interface ProcessingDialogProps {
  open: boolean;
  csvData: CSVRow[];
  config: AppConfig;
  onComplete: (results: LeadResult[]) => void;
  onClose: () => void;
}

interface ProcessingState {
  current: number;
  results: LeadResult[];
  errors: string[];
  isProcessing: boolean;
  currentLead?: string;
}

const ProcessingDialog: React.FC<ProcessingDialogProps> = ({
  open,
  csvData,
  config,
  onComplete,
  onClose
}) => {
  const [state, setState] = useState<ProcessingState>({
    current: 0,
    results: [],
    errors: [],
    isProcessing: false
  });

  const cancelRef = useRef(false);
  const openAIServiceRef = useRef<OpenAIService | null>(null);

  useEffect(() => {
    if (open && !state.isProcessing) {
      startProcessing();
    }

    return () => {
      cancelRef.current = true;
    };
  }, [open]);

  const startProcessing = async () => {
    cancelRef.current = false;
    setState({
      current: 0,
      results: [],
      errors: [],
      isProcessing: true
    });

    // Initialize OpenAI service
    openAIServiceRef.current = new OpenAIService(config.openai);

    const results: LeadResult[] = [];
    const batchSize = config.processing.batchSize;
    const maxConcurrent = config.processing.maxConcurrent;

    for (let i = 0; i < csvData.length; i += batchSize) {
      if (cancelRef.current) break;

      const batch = csvData.slice(i, i + batchSize);
      const batchPromises = batch.map((row, index) => 
        processLead(row, i + index)
      );

      // Process batch with concurrency limit
      const batchResults = await processWithConcurrency(
        batchPromises,
        maxConcurrent
      );

      results.push(...batchResults.filter(r => r !== null) as LeadResult[]);

      setState(prev => ({
        ...prev,
        current: Math.min(i + batchSize, csvData.length),
        results: [...results]
      }));
    }

    if (!cancelRef.current) {
      setState(prev => ({ ...prev, isProcessing: false }));
      onComplete(results);
    }
  };

  const processWithConcurrency = async <T,>(
    promises: Promise<T>[],
    limit: number
  ): Promise<T[]> => {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const promise of promises) {
      const p = promise.then(result => {
        results.push(result);
      }).catch(error => {
        setState(prev => ({
          ...prev,
          errors: [...prev.errors, error.message]
        }));
        results.push(null as any);
      });

      executing.push(p as any);

      if (executing.length >= limit) {
        await Promise.race(executing);
        executing.splice(0, 1);
      }
    }

    await Promise.all(executing);
    return results;
  };

  const processLead = async (row: CSVRow, _index: number): Promise<LeadResult | null> => {
    try {
      setState(prev => ({
        ...prev,
        currentLead: row.url
      }));

      // Extract contact information
      const extracted = ContactExtractor.extractContactInfo(row);
      const confidenceScore = ContactExtractor.calculateConfidenceScore(extracted);

      // Prepare text for AI classification
      const textContent = [
        row.snippet,
        row.description,
        extracted.names.join(' '),
        extracted.titles.join(' '),
        extracted.companies.join(' ')
      ].filter(Boolean).join(' ');

      // AI Classification
      const classification = await openAIServiceRef.current!.classifyLead(
        row.url,
        textContent,
        extracted
      );

      const result: LeadResult = {
        url: row.url,
        matchedKeywords: extracted.keywords,
        contactName: extracted.names[0] || '',
        contactTitle: extracted.titles[0] || '',
        contactEmail: extracted.emails[0] || '',
        contactPhone: extracted.phones[0] || '',
        companyName: extracted.companies[0] || '',
        contactAddress: extracted.addresses[0] || '',
        additionalInfo: textContent.substring(0, 500),
        classification: classification.type,
        isPersonProfile: classification.isPerson,
        quality: classification.quality,
        confidenceScore,
        needsContactSearch: classification.needsContactSearch,
        skipReason: classification.skipReason,
        processedAt: new Date(),
        source: 'csv-import'
      };

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, `Error processing ${row.url}: ${(error as Error).message}`]
      }));
      return null;
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    onClose();
  };

  const progress = csvData.length > 0 
    ? (state.current / csvData.length) * 100 
    : 0;

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'person':
        return <PersonIcon color="success" />;
      case 'business':
        return <BusinessIcon color="info" />;
      case 'event':
        return <EventIcon color="warning" />;
      default:
        return <ErrorIcon color="error" />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        Processing Leads
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2">
              Progress: {state.current} of {csvData.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>

        {state.currentLead && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Processing: {state.currentLead}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip
            label={`Processed: ${state.results.length}`}
            color="primary"
            size="small"
          />
          <Chip
            label={`Qualified: ${state.results.filter(r => r.confidenceScore >= config.scoring.thresholds.minimum).length}`}
            color="success"
            size="small"
          />
          {state.errors.length > 0 && (
            <Chip
              label={`Errors: ${state.errors.length}`}
              color="error"
              size="small"
            />
          )}
        </Box>

        {state.results.length > 0 && (
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>
              Recent Results:
            </Typography>
            <List dense>
              {state.results.slice(-5).reverse().map((result, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getClassificationIcon(result.classification)}
                  </ListItemIcon>
                  <ListItemText
                    primary={result.contactName || result.companyName || 'Unknown'}
                    secondary={
                      <Box display="flex" gap={1} alignItems="center">
                        <Typography variant="caption">
                          Score: {result.confidenceScore}
                        </Typography>
                        {result.contactEmail && (
                          <Chip label="Has Email" size="small" color="success" />
                        )}
                        {result.contactPhone && (
                          <Chip label="Has Phone" size="small" color="success" />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {state.errors.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {state.errors.length} errors occurred during processing
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleCancel} 
          disabled={!state.isProcessing}
        >
          {state.isProcessing ? 'Cancel' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProcessingDialog;