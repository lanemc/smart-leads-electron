import Papa, { ParseResult as PapaParseResult } from 'papaparse';
import { CSVRow } from '../types/leads';

export interface ParseResult {
  success: boolean;
  data?: CSVRow[];
  error?: string;
  meta?: {
    fields: string[];
    rowCount: number;
  };
}

export class CSVParser {
  static async parseFile(file: File): Promise<ParseResult> {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        complete: (results: PapaParseResult<CSVRow>) => {
          if (results.errors.length > 0) {
            resolve({
              success: false,
              error: `CSV parsing errors: ${results.errors.map((e: any) => e.message).join(', ')}`
            });
            return;
          }

          const data = results.data as CSVRow[];
          
          // Validate required fields
          const validation = this.validateCSV(data);
          if (!validation.isValid) {
            resolve({
              success: false,
              error: validation.error
            });
            return;
          }

          resolve({
            success: true,
            data,
            meta: {
              fields: results.meta.fields || [],
              rowCount: data.length
            }
          });
        },
        error: (error: any) => {
          resolve({
            success: false,
            error: `Failed to parse CSV: ${error.message}`
          });
        }
      });
    });
  }

  static async parseContent(content: string): Promise<ParseResult> {
    return new Promise((resolve) => {
      Papa.parse(content, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
        complete: (results: PapaParseResult<CSVRow>) => {
          if (results.errors.length > 0) {
            resolve({
              success: false,
              error: `CSV parsing errors: ${results.errors.map((e: any) => e.message).join(', ')}`
            });
            return;
          }

          const data = results.data as CSVRow[];
          
          // Validate required fields
          const validation = this.validateCSV(data);
          if (!validation.isValid) {
            resolve({
              success: false,
              error: validation.error
            });
            return;
          }

          resolve({
            success: true,
            data,
            meta: {
              fields: results.meta.fields || [],
              rowCount: data.length
            }
          });
        },
        error: (error: any) => {
          resolve({
            success: false,
            error: `Failed to parse CSV: ${error.message}`
          });
        }
      });
    });
  }

  static validateCSV(data: CSVRow[]): { isValid: boolean; error?: string } {
    if (!data || data.length === 0) {
      return { isValid: false, error: 'CSV file is empty' };
    }

    const firstRow = data[0];
    
    // Check for required fields
    if (!('url' in firstRow)) {
      return { isValid: false, error: 'CSV must contain a "url" column' };
    }

    // Check for at least one content field
    const hasContent = ('snippet' in firstRow) || ('description' in firstRow);
    if (!hasContent) {
      return { isValid: false, error: 'CSV must contain either a "snippet" or "description" column' };
    }

    // Validate that URLs are present
    const rowsWithoutUrl = data.filter(row => !row.url || row.url.trim() === '');
    if (rowsWithoutUrl.length > 0) {
      return { 
        isValid: false, 
        error: `${rowsWithoutUrl.length} rows are missing URL values` 
      };
    }

    return { isValid: true };
  }

  static exportToCSV(data: any[]): string {
    const csv = Papa.unparse(data, {
      header: true,
      skipEmptyLines: true
    });
    
    return csv;
  }
}