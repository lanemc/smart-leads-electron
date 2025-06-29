import { ContactExtractor } from '../shared/services/contact-extractor';
import { CSVRow } from '../shared/types/leads';

describe('ContactExtractor', () => {
  describe('extractContactInfo', () => {
    it('should extract contact information from explicit fields', () => {
      const row: CSVRow = {
        url: 'https://example.com',
        contact_name: 'John Doe',
        contact_title: 'CEO',
        contact_email: 'john@example.com',
        contact_phone: '(913) 555-1234',
        company_name: 'ABC Corporation',
        contact_address: '123 Main St, Kansas City, MO',
        keywords: 'sponsor, executive, leadership'
      };

      const result = ContactExtractor.extractContactInfo(row);

      expect(result.names).toContain('John Doe');
      expect(result.titles).toContain('CEO');
      expect(result.emails).toContain('john@example.com');
      expect(result.phones).toContain('(913) 555-1234');
      expect(result.companies).toContain('ABC Corporation');
      expect(result.addresses).toContain('123 Main St, Kansas City, MO');
      expect(result.keywords).toContain('sponsor');
      expect(result.keywords).toContain('executive');
    });

    it('should extract information from snippet text', () => {
      const row: CSVRow = {
        url: 'https://example.com',
        snippet: 'Jane Smith, Director of Marketing at XYZ Corp, can be reached at jane.smith@xyz.com or 913-555-5678'
      };

      const result = ContactExtractor.extractContactInfo(row);

      expect(result.names).toContain('Jane Smith');
      expect(result.titles.some(t => t.toLowerCase().includes('director'))).toBe(true);
      expect(result.emails).toContain('jane.smith@xyz.com');
      expect(result.phones.some(p => p.includes('555-5678'))).toBe(true);
    });

    it('should handle multiple phone formats', () => {
      const row: CSVRow = {
        url: 'https://example.com',
        snippet: 'Contact us at (913) 555-1234, 913.555.5678, or +1 913-555-9012'
      };

      const result = ContactExtractor.extractContactInfo(row);

      expect(result.phones).toHaveLength(3);
      expect(result.phones[0]).toMatch(/\(\d{3}\) \d{3}-\d{4}/);
    });

    it('should extract addresses', () => {
      const row: CSVRow = {
        url: 'https://example.com',
        snippet: 'Located at 1234 Stadium Drive, Kansas City, MO. Our office is at 5678 Business Blvd Suite 100'
      };

      const result = ContactExtractor.extractContactInfo(row);

      expect(result.addresses.length).toBeGreaterThan(0);
      expect(result.addresses.some(a => a.includes('Stadium Drive'))).toBe(true);
    });

    it('should extract high-value keywords', () => {
      const row: CSVRow = {
        url: 'https://example.com',
        snippet: 'John is the CEO and Founder of a presenting sponsor company for the Kansas City Royals'
      };

      const result = ContactExtractor.extractContactInfo(row);

      expect(result.keywords).toContain('ceo');
      expect(result.keywords).toContain('founder');
      expect(result.keywords).toContain('presenting sponsor');
      expect(result.keywords).toContain('kansas city');
      expect(result.keywords).toContain('royals');
    });

    it('should deduplicate extracted information', () => {
      const row: CSVRow = {
        url: 'https://example.com',
        contact_email: 'john@example.com',
        snippet: 'Contact John at john@example.com or email john@example.com'
      };

      const result = ContactExtractor.extractContactInfo(row);

      expect(result.emails).toHaveLength(1);
      expect(result.emails[0]).toBe('john@example.com');
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should give high score for complete contact information', () => {
      const extracted = {
        names: ['John Doe'],
        titles: ['CEO'],
        emails: ['john@example.com'],
        phones: ['(913) 555-1234'],
        companies: ['ABC Corp'],
        addresses: ['123 Main St'],
        keywords: ['ceo', 'sponsor', 'executive', 'kansas city']
      };

      const score = ContactExtractor.calculateConfidenceScore(extracted);

      expect(score).toBeGreaterThan(80);
    });

    it('should give medium score for partial information', () => {
      const extracted = {
        names: ['John Doe'],
        titles: [],
        emails: ['john@example.com'],
        phones: [],
        companies: ['ABC Corp'],
        addresses: [],
        keywords: ['business', 'kansas city']
      };

      const score = ContactExtractor.calculateConfidenceScore(extracted);

      expect(score).toBeGreaterThan(40);
      expect(score).toBeLessThan(70);
    });

    it('should give low score for minimal information', () => {
      const extracted = {
        names: ['John'],
        titles: [],
        emails: [],
        phones: [],
        companies: [],
        addresses: [],
        keywords: []
      };

      const score = ContactExtractor.calculateConfidenceScore(extracted);

      expect(score).toBeLessThan(30);
    });

    it('should add bonus for high-value keywords', () => {
      const baseExtracted = {
        names: ['John Doe'],
        titles: [],
        emails: ['john@example.com'],
        phones: [],
        companies: [],
        addresses: [],
        keywords: []
      };

      const withKeywords = {
        ...baseExtracted,
        titles: ['President'],
        keywords: ['founder', 'owner']
      };

      const baseScore = ContactExtractor.calculateConfidenceScore(baseExtracted);
      const keywordScore = ContactExtractor.calculateConfidenceScore(withKeywords);

      expect(keywordScore).toBeGreaterThan(baseScore);
    });

    it('should cap score at 100', () => {
      const extracted = {
        names: ['John Doe', 'Jane Smith'],
        titles: ['CEO', 'President', 'Founder'],
        emails: ['john@example.com', 'jane@example.com'],
        phones: ['(913) 555-1234', '(913) 555-5678'],
        companies: ['ABC Corp', 'XYZ Inc'],
        addresses: ['123 Main St', '456 Oak Ave'],
        keywords: ['ceo', 'president', 'founder', 'owner', 'executive', 'sponsor']
      };

      const score = ContactExtractor.calculateConfidenceScore(extracted);

      expect(score).toBe(100);
    });
  });
});