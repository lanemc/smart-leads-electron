import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import {
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { AppConfig } from '../../shared/types/leads';

interface ConfigDialogProps {
  open: boolean;
  config: AppConfig;
  onClose: () => void;
  onSave: (config: AppConfig) => void;
}

const ConfigDialog: React.FC<ConfigDialogProps> = ({ open, config, onClose, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalConfig(config);
    setErrors({});
  }, [config, open]);

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate API Key
    if (!localConfig.openai.apiKey) {
      newErrors.apiKey = 'API Key is required';
    }

    // Validate numeric values
    if (localConfig.processing.batchSize <= 0) {
      newErrors.batchSize = 'Batch size must be greater than 0';
    }

    if (localConfig.processing.maxConcurrent <= 0) {
      newErrors.maxConcurrent = 'Max concurrent must be greater than 0';
    }

    if (localConfig.processing.retryAttempts < 0) {
      newErrors.retryAttempts = 'Retry attempts cannot be negative';
    }

    // Validate thresholds (0-100)
    const thresholds = localConfig.scoring.thresholds;
    if (thresholds.highValue < 0 || thresholds.highValue > 100) {
      newErrors.highValue = 'Threshold must be between 0 and 100';
    }
    if (thresholds.qualified < 0 || thresholds.qualified > 100) {
      newErrors.qualified = 'Threshold must be between 0 and 100';
    }
    if (thresholds.minimum < 0 || thresholds.minimum > 100) {
      newErrors.minimum = 'Threshold must be between 0 and 100';
    }

    // Validate threshold order
    if (thresholds.highValue <= thresholds.qualified) {
      newErrors.highValue = 'High value must be greater than qualified';
    }
    if (thresholds.qualified <= thresholds.minimum) {
      newErrors.qualified = 'Qualified must be greater than minimum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateConfig()) {
      try {
        // Validate API key if provided
        if (localConfig.openai.apiKey) {
          const validation = await window.electronAPI.validateApiKey(localConfig.openai.apiKey);
          if (!validation.success || !validation.isValid) {
            setErrors({ ...errors, apiKey: 'Invalid API key format' });
            return;
          }
        }

        // Save configuration securely
        const saveResult = await window.electronAPI.saveConfig(localConfig);
        if (!saveResult.success) {
          throw new Error(saveResult.error);
        }

        onSave(localConfig);
        onClose();
      } catch (error) {
        setErrors({ ...errors, general: `Failed to save configuration: ${(error as Error).message}` });
      }
    }
  };

  const handleChange = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...localConfig };
    let current: any = newConfig;

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    setLocalConfig(newConfig);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configuration</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            OpenAI Settings
          </Typography>
          
          <TextField
            fullWidth
            label="OpenAI API Key"
            type={showApiKey ? 'text' : 'password'}
            value={localConfig.openai.apiKey}
            onChange={(e) => handleChange('openai.apiKey', e.target.value)}
            error={!!errors.apiKey}
            helperText={errors.apiKey || 'Your OpenAI API key for AI classification'}
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowApiKey(!showApiKey)}
                    edge="end"
                  >
                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="Model"
            value={localConfig.openai.model}
            onChange={(e) => handleChange('openai.model', e.target.value)}
            margin="normal"
            select
            SelectProps={{ native: true }}
          >
            <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </TextField>

          <TextField
            fullWidth
            label="Temperature"
            type="number"
            value={localConfig.openai.temperature}
            onChange={(e) => handleChange('openai.temperature', parseFloat(e.target.value))}
            margin="normal"
            inputProps={{ min: 0, max: 2, step: 0.1 }}
            helperText="Lower values make output more focused (0-2)"
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Processing Settings
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Batch Size"
                type="number"
                value={localConfig.processing.batchSize}
                onChange={(e) => handleChange('processing.batchSize', parseInt(e.target.value))}
                error={!!errors.batchSize}
                helperText={errors.batchSize}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Max Concurrent"
                type="number"
                value={localConfig.processing.maxConcurrent}
                onChange={(e) => handleChange('processing.maxConcurrent', parseInt(e.target.value))}
                error={!!errors.maxConcurrent}
                helperText={errors.maxConcurrent}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Retry Attempts"
                type="number"
                value={localConfig.processing.retryAttempts}
                onChange={(e) => handleChange('processing.retryAttempts', parseInt(e.target.value))}
                error={!!errors.retryAttempts}
                helperText={errors.retryAttempts}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Scoring Thresholds
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="High Value Threshold"
                type="number"
                value={localConfig.scoring.thresholds.highValue}
                onChange={(e) => handleChange('scoring.thresholds.highValue', parseInt(e.target.value))}
                error={!!errors.highValue}
                helperText={errors.highValue || '80-100'}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Qualified Threshold"
                type="number"
                value={localConfig.scoring.thresholds.qualified}
                onChange={(e) => handleChange('scoring.thresholds.qualified', parseInt(e.target.value))}
                error={!!errors.qualified}
                helperText={errors.qualified || '60-79'}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                label="Minimum Threshold"
                type="number"
                value={localConfig.scoring.thresholds.minimum}
                onChange={(e) => handleChange('scoring.thresholds.minimum', parseInt(e.target.value))}
                error={!!errors.minimum}
                helperText={errors.minimum || '40-59'}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
          </Grid>

          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Please fix the errors before saving
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigDialog;