export interface CSVRow {
  url: string;
  snippet?: string;
  description?: string;
  contact_name?: string;
  contact_title?: string;
  contact_email?: string;
  contact_phone?: string;
  company_name?: string;
  contact_address?: string;
  keywords?: string;
  [key: string]: string | undefined;
}

export interface LeadResult {
  url: string;
  matchedKeywords: string[];
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string;
  contactAddress: string;
  additionalInfo: string;
  classification: 'person' | 'business' | 'event' | 'unknown';
  isPersonProfile: boolean;
  quality: number;
  confidenceScore: number;
  needsContactSearch: boolean;
  skipReason?: string;
  processedAt: Date;
  source: 'csv-import';
}

export interface ProcessingStats {
  total: number;
  processed: number;
  qualified: number;
  rejected: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  currentLead?: string;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  includeRejected: boolean;
  minConfidenceScore: number;
}

export interface AppConfig {
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
  };
  processing: {
    batchSize: number;
    maxConcurrent: number;
    retryAttempts: number;
  };
  api?: {
    endpoint: string;
    authToken: string;
  };
  scoring: {
    thresholds: {
      highValue: number;
      qualified: number;
      minimum: number;
    };
  };
}

export type ProcessingStatus = 'idle' | 'loading' | 'processing' | 'completed' | 'error';

export interface AppState {
  status: ProcessingStatus;
  csvData: CSVRow[];
  results: LeadResult[];
  stats: ProcessingStats;
  error?: string;
  config: AppConfig;
}