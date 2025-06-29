export class RegexUtils {
  // Email patterns
  static readonly EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
  
  // Phone patterns
  static readonly PHONE_PATTERNS = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    /\b\(\d{3}\)\s?\d{3}[-.\s]?\d{4}\b/g,
    /\b\+?1?\s?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    /\b\d{10}\b/g
  ];

  // Name patterns
  static readonly NAME_PATTERNS = [
    /(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:\s|$|,)/g,
    /(?:Contact:|Name:|by\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
  ];

  // Title patterns
  static readonly TITLE_PATTERNS = [
    /\b(?:CEO|CTO|CFO|COO|CMO|President|Vice President|VP|Director|Manager|Founder|Owner|Principal|Partner|Executive|Administrator|Coordinator)\b/gi,
    /(?:Title:|Position:)\s*([^,\n]+)/gi
  ];

  // Company patterns
  static readonly COMPANY_PATTERNS = [
    /\b(?:Inc\.|LLC|Corp\.|Corporation|Company|Ltd\.|Limited|Partners|Partnership|Group|Holdings|Enterprises)\b/gi,
    /(?:Company:|Organization:|Employer:)\s*([^,\n]+)/gi
  ];

  // Address patterns
  static readonly ADDRESS_PATTERNS = [
    /\b\d{1,5}\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Plaza|Square|Park)\b[^,\n]*/gi,
    /(?:Address:|Location:)\s*([^,\n]+)/gi
  ];

  static extractEmails(text: string): string[] {
    const matches = text.match(this.EMAIL_PATTERN) || [];
    return [...new Set(matches.map(email => email.toLowerCase()))];
  }

  static extractPhones(text: string): string[] {
    const phones: string[] = [];
    
    for (const pattern of this.PHONE_PATTERNS) {
      const matches = text.match(pattern) || [];
      phones.push(...matches);
    }
    
    return [...new Set(phones.map(phone => this.formatPhone(phone)))];
  }

  static formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return phone;
  }

  static extractNames(text: string): string[] {
    const names: string[] = [];
    
    for (const pattern of this.NAME_PATTERNS) {
      const matches = [...text.matchAll(pattern)];
      names.push(...matches.map(match => match[1]));
    }
    
    return [...new Set(names.filter(name => 
      name && name.length > 2 && !this.isCommonWord(name)
    ))];
  }

  static extractTitles(text: string): string[] {
    const titles: string[] = [];
    
    const titleMatches = text.match(this.TITLE_PATTERNS[0]) || [];
    titles.push(...titleMatches);
    
    const explicitTitles = [...text.matchAll(this.TITLE_PATTERNS[1])];
    titles.push(...explicitTitles.map(match => match[1]));
    
    return [...new Set(titles.filter(title => title && title.length > 2))];
  }

  static extractCompanies(text: string): string[] {
    const companies: string[] = [];
    
    const companyMatches = [...text.matchAll(this.COMPANY_PATTERNS[0])];
    const sentences = text.split(/[.!?]/);
    
    for (const sentence of sentences) {
      for (const match of companyMatches) {
        const index = sentence.indexOf(match[0]);
        if (index > 0) {
          const beforeMatch = sentence.substring(0, index).trim();
          const words = beforeMatch.split(/\s+/).slice(-3);
          if (words.length > 0) {
            companies.push(words.join(' ') + ' ' + match[0]);
          }
        }
      }
    }
    
    const explicitCompanies = [...text.matchAll(this.COMPANY_PATTERNS[1])];
    companies.push(...explicitCompanies.map(match => match[1]));
    
    return [...new Set(companies.filter(company => 
      company && company.length > 2 && !this.isCommonWord(company)
    ))];
  }

  static extractAddresses(text: string): string[] {
    const addresses: string[] = [];
    
    for (const pattern of this.ADDRESS_PATTERNS) {
      const matches = text.match(pattern) || [];
      addresses.push(...matches);
    }
    
    return [...new Set(addresses.filter(addr => addr && addr.length > 10))];
  }

  private static isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'for', 'with', 'from', 'about', 'contact',
      'email', 'phone', 'address', 'website', 'page', 'profile'
    ];
    return commonWords.includes(word.toLowerCase());
  }
}