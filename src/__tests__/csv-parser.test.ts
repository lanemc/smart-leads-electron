import { CSVParser } from '../shared/services/csv-parser';
import { CSVRow } from '../shared/types/leads';

describe('CSVParser', () => {
  describe('parseContent', () => {
    it('should successfully parse valid CSV content', async () => {
      const csvContent = `url,snippet,contact_name,contact_email
https://example.com/john,John Doe is the CEO,John Doe,john@example.com
https://example.com/jane,Jane Smith is the Director,Jane Smith,jane@example.com`;

      const result = await CSVParser.parseContent(csvContent);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0]).toEqual({
        url: 'https://example.com/john',
        snippet: 'John Doe is the CEO',
        contact_name: 'John Doe',
        contact_email: 'john@example.com'
      });
      expect(result.meta?.rowCount).toBe(2);
      expect(result.meta?.fields).toContain('url');
    });

    it('should fail when CSV is missing required url column', async () => {
      const csvContent = `name,email,snippet
John Doe,john@example.com,Some content`;

      const result = await CSVParser.parseContent(csvContent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must contain a "url" column');
    });

    it('should fail when CSV is missing content columns', async () => {
      const csvContent = `url,name,email
https://example.com,John Doe,john@example.com`;

      const result = await CSVParser.parseContent(csvContent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('must contain either a "snippet" or "description" column');
    });

    it('should fail when CSV has empty url values', async () => {
      const csvContent = `url,snippet
https://example.com,Content 1
,Content 2
https://example.com,Content 3`;

      const result = await CSVParser.parseContent(csvContent);

      expect(result.success).toBe(false);
      expect(result.error).toContain('rows are missing URL values');
    });

    it('should handle CSV with description instead of snippet', async () => {
      const csvContent = `url,description
https://example.com,This is a description`;

      const result = await CSVParser.parseContent(csvContent);

      expect(result.success).toBe(true);
      expect(result.data![0].description).toBe('This is a description');
    });

    it('should skip empty lines', async () => {
      const csvContent = `url,snippet

https://example.com,Content 1

https://example.com,Content 2
`;

      const result = await CSVParser.parseContent(csvContent);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('validateCSV', () => {
    it('should validate correct CSV data', () => {
      const data: CSVRow[] = [
        { url: 'https://example.com', snippet: 'Some content' }
      ];

      const validation = CSVParser.validateCSV(data);

      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('should reject empty data', () => {
      const validation = CSVParser.validateCSV([]);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('empty');
    });

    it('should reject data without url column', () => {
      const data = [
        { snippet: 'Some content' } as any
      ];

      const validation = CSVParser.validateCSV(data);

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('url');
    });
  });

  describe('exportToCSV', () => {
    it('should export data to CSV format', () => {
      const data = [
        { 
          url: 'https://example.com',
          contactName: 'John Doe',
          contactEmail: 'john@example.com',
          confidenceScore: 85
        }
      ];

      const csv = CSVParser.exportToCSV(data);

      expect(csv).toContain('url,contactName,contactEmail,confidenceScore');
      expect(csv).toContain('https://example.com,John Doe,john@example.com,85');
    });

    it('should handle special characters in CSV export', () => {
      const data = [
        { 
          url: 'https://example.com',
          contactName: 'John "CEO" Doe',
          snippet: 'Content with, comma'
        }
      ];

      const csv = CSVParser.exportToCSV(data);

      expect(csv).toContain('"John ""CEO"" Doe"');
      expect(csv).toContain('"Content with, comma"');
    });
  });
});