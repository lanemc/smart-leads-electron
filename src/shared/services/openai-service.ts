import OpenAI from 'openai';
import { ExtractedContact } from './contact-extractor';

export interface ClassificationResult {
  type: 'person' | 'business' | 'event' | 'unknown';
  isPerson: boolean;
  quality: number;
  needsContactSearch: boolean;
  skipReason?: string;
  reasoning?: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

export class OpenAIService {
  private openai: OpenAI;
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true // Required for Electron renderer process
    });
  }

  async classifyLead(
    url: string,
    textContent: string,
    extracted: ExtractedContact
  ): Promise<ClassificationResult> {
    try {
      const prompt = this.buildClassificationPrompt(url, textContent, extracted);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that classifies leads for the Kansas City Royals. 
            Classify each lead as: person (individual profile), business (company/organization), 
            event (event page/sponsor listing), or unknown. 
            Rate quality 1-10 based on potential partnership value.
            Identify if businesses need contact person search.
            Skip event pages and low-value leads.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        type: result.type || 'unknown',
        isPerson: result.isPerson || false,
        quality: result.quality || 0,
        needsContactSearch: result.needsContactSearch || false,
        skipReason: result.skipReason,
        reasoning: result.reasoning
      };
    } catch (error) {
      console.error('OpenAI classification error:', error);
      // Fallback to rule-based classification
      return this.fallbackClassification(textContent, extracted);
    }
  }

  private buildClassificationPrompt(
    url: string,
    textContent: string,
    extracted: ExtractedContact
  ): string {
    return `
    Analyze this lead for the Kansas City Royals sponsorship opportunities:

    URL: ${url}
    
    Extracted Information:
    - Names: ${extracted.names.join(', ') || 'None'}
    - Titles: ${extracted.titles.join(', ') || 'None'}
    - Companies: ${extracted.companies.join(', ') || 'None'}
    - Emails: ${extracted.emails.length > 0 ? 'Found' : 'None'}
    - Phones: ${extracted.phones.length > 0 ? 'Found' : 'None'}
    - Keywords: ${extracted.keywords.slice(0, 10).join(', ')}
    
    Content Preview:
    ${textContent.substring(0, 1000)}
    
    Classify this lead and return a JSON object with:
    {
      "type": "person|business|event|unknown",
      "isPerson": boolean,
      "quality": 1-10 (partnership potential),
      "needsContactSearch": boolean (for businesses without contact info),
      "skipReason": string or null (why to skip this lead),
      "reasoning": string (brief explanation)
    }
    
    Guidelines:
    - High quality (8-10): CEOs, Presidents, Founders, business owners in Kansas City area
    - Medium quality (5-7): Directors, Managers, established businesses
    - Low quality (1-4): Generic profiles, no clear business connection
    - Skip: Event pages, sponsor listings, job postings
    `;
  }

  private fallbackClassification(
    textContent: string,
    extracted: ExtractedContact
  ): ClassificationResult {
    const lowerText = textContent.toLowerCase();
    
    // Check for event indicators
    if (lowerText.includes('event') || lowerText.includes('sponsor') || 
        lowerText.includes('conference') || lowerText.includes('gala')) {
      return {
        type: 'event',
        isPerson: false,
        quality: 0,
        needsContactSearch: false,
        skipReason: 'Event or sponsor page'
      };
    }

    // Check if it's a person
    const isPerson = extracted.names.length > 0 && 
                    (extracted.titles.length > 0 || 
                     lowerText.includes('ceo') || 
                     lowerText.includes('president') ||
                     lowerText.includes('founder'));

    // Check if it's a business
    const isBusiness = extracted.companies.length > 0 || 
                      lowerText.includes('company') || 
                      lowerText.includes('corporation') ||
                      lowerText.includes('llc');

    // Calculate quality based on available information
    let quality = 5;
    if (extracted.emails.length > 0) quality += 2;
    if (extracted.phones.length > 0) quality += 1;
    if (isPerson && extracted.titles.some(t => 
      /ceo|president|founder|owner|executive/i.test(t)
    )) quality += 2;

    quality = Math.min(quality, 10);

    return {
      type: isPerson ? 'person' : isBusiness ? 'business' : 'unknown',
      isPerson,
      quality,
      needsContactSearch: isBusiness && extracted.emails.length === 0,
      reasoning: 'Classified using fallback rules'
    };
  }

  async performFinalPersonFilter(leads: ClassificationResult[]): Promise<ClassificationResult[]> {
    // This would implement the second phase of filtering
    // For now, return as-is
    return leads;
  }
}