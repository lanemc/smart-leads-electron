import { RegexUtils } from '../utils/regex-patterns';
import { CSVRow } from '../types/leads';

export interface ExtractedContact {
  names: string[];
  titles: string[];
  emails: string[];
  phones: string[];
  companies: string[];
  addresses: string[];
  keywords: string[];
}

export class ContactExtractor {
  static extractContactInfo(row: CSVRow): ExtractedContact {
    // Combine all text fields for extraction
    const textContent = [
      row.snippet,
      row.description,
      row.contact_name,
      row.contact_title,
      row.company_name,
      row.contact_address,
      row.keywords
    ].filter(Boolean).join(' ');

    const extracted: ExtractedContact = {
      names: [],
      titles: [],
      emails: [],
      phones: [],
      companies: [],
      addresses: [],
      keywords: []
    };

    // Extract from text content
    if (textContent) {
      extracted.names.push(...RegexUtils.extractNames(textContent));
      extracted.titles.push(...RegexUtils.extractTitles(textContent));
      extracted.emails.push(...RegexUtils.extractEmails(textContent));
      extracted.phones.push(...RegexUtils.extractPhones(textContent));
      extracted.companies.push(...RegexUtils.extractCompanies(textContent));
      extracted.addresses.push(...RegexUtils.extractAddresses(textContent));
    }

    // Add explicit fields if available
    if (row.contact_name && !extracted.names.includes(row.contact_name)) {
      extracted.names.unshift(row.contact_name);
    }

    if (row.contact_title && !extracted.titles.includes(row.contact_title)) {
      extracted.titles.unshift(row.contact_title);
    }

    if (row.contact_email && !extracted.emails.includes(row.contact_email)) {
      extracted.emails.unshift(row.contact_email);
    }

    if (row.contact_phone) {
      const formattedPhone = RegexUtils.formatPhone(row.contact_phone);
      if (!extracted.phones.includes(formattedPhone)) {
        extracted.phones.unshift(formattedPhone);
      }
    }

    if (row.company_name && !extracted.companies.includes(row.company_name)) {
      extracted.companies.unshift(row.company_name);
    }

    if (row.contact_address && !extracted.addresses.includes(row.contact_address)) {
      extracted.addresses.unshift(row.contact_address);
    }

    // Extract keywords
    if (row.keywords) {
      extracted.keywords = row.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    }

    // Additional keyword extraction from text
    const keywordPatterns = [
      /\b(?:sponsor|sponsorship|presenting sponsor|partner|partnership|corporate|executive|leadership|owner|founder)\b/gi,
      /\b(?:Kansas City|KC|Royals|baseball|sports|entertainment)\b/gi,
      /\b(?:marketing|sales|business development|ticketing|hospitality)\b/gi
    ];

    for (const pattern of keywordPatterns) {
      const matches = textContent.match(pattern) || [];
      extracted.keywords.push(...matches);
    }

    // Deduplicate keywords
    extracted.keywords = [...new Set(extracted.keywords.map(k => k.toLowerCase()))];

    return extracted;
  }

  static calculateConfidenceScore(extracted: ExtractedContact): number {
    let score = 0;

    // High value indicators
    if (extracted.emails.length > 0) score += 30;
    if (extracted.phones.length > 0) score += 25;
    if (extracted.names.length > 0 && extracted.titles.length > 0) score += 20;

    // Medium value indicators
    if (extracted.names.length > 0) score += 10;
    if (extracted.companies.length > 0) score += 5;
    if (extracted.addresses.length > 0) score += 8;
    if (extracted.keywords.length > 3) score += 5;

    // Keyword quality bonus
    const highValueKeywords = ['ceo', 'president', 'founder', 'owner', 'executive', 'director'];
    const hasHighValueKeyword = extracted.keywords.some(k => 
      highValueKeywords.some(hk => k.includes(hk))
    ) || extracted.titles.some(t => 
      highValueKeywords.some(hk => t.toLowerCase().includes(hk))
    );
    
    if (hasHighValueKeyword) score += 10;

    const sponsorKeywords = ['sponsor', 'presenting sponsor', 'partner'];
    const hasSponsorKeyword = extracted.keywords.some(k => 
      sponsorKeywords.some(sk => k.includes(sk))
    );
    
    if (hasSponsorKeyword) score += 2;

    return Math.min(score, 100);
  }
}