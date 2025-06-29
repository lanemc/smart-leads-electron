# Royals Lead Qualifier - Electron App Requirements

## Overview

A standalone Electron desktop application that allows the Kansas City Royals admin to bulk upload CSV files containing potential leads and have them automatically qualified/graded using the same AI-powered grading system from the web scraper.

## Core Features

### 1. CSV Import
- Drag-and-drop CSV file upload interface
- Support for large CSV files (10,000+ rows)
- CSV validation and error reporting
- Preview imported data before processing

### 2. Lead Qualification Engine
- Use the exact same AI-powered grading logic from the web scraper
- Classify leads as Person vs Business vs Event/Sponsor Page
- Calculate confidence scores based on available contact information
- Filter out event pages and sponsor listings
- Identify high-value leads for partnerships

### 3. Processing Pipeline
1. Parse CSV and extract lead data
2. Validate and clean contact information
3. Run AI classification using GPT-4o-mini
4. Apply confidence scoring algorithm
5. Export qualified leads with grades

### 4. Export Functionality
- Export qualified leads to CSV with grading scores
- Export rejected leads with reasons
- Generate summary report with statistics
- Optional direct submission to CRM via API

## Technical Architecture

### Core Dependencies from Existing System

#### 1. Grading Logic Files
- **Primary API Route**: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/api/route.ts`
  - Contains AI classification logic (lines 294-707)
  - Lead scoring algorithm (lines 271-293)
  - Contact extraction functions (lines 27-165)
  
#### 2. Type Definitions
- **Types**: `/Users/lanemc/sites/serve-ai-marketing/lib/royals-ticket-dip-types.ts`
  - LeadResult interface (lines 41-58)
  - RoyalsLead interface (lines 19-38)

#### 3. Regex Patterns
- **Patterns**: `/Users/lanemc/sites/serve-ai-marketing/scripts/regex-patterns.ts`
  - Email extraction patterns
  - Phone number patterns and formatting
  - Name and title extraction
  - Company identification
  - Address extraction

#### 4. Service Layer
- **Service**: `/Users/lanemc/sites/serve-ai-marketing/lib/royals-ticket-dip-service.ts`
  - Database models and structure
  - Caching logic (optional for offline mode)

#### 5. Additional API Routes
- **Leads API**: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/api/leads/route.ts`
  - Lead retrieval and filtering logic
- **Individual Lead API**: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/api/lead/[id]/route.ts`
  - Single lead operations
- **Outreach Generation**: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/api/generate-outreach/route.ts`
  - AI-powered outreach message generation

#### 6. UI Components (for reference)
- **Leads Table**: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/leads/page.tsx`
  - Shows how leads are displayed and filtered
- **Main Dashboard**: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/royals-ticket-dip.tsx`
  - Main interface design patterns
- **Individual Lead View**: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/lead/[id]/page.tsx`
  - Lead detail display logic

#### 7. Database and Cache Utilities
- **Cache Service**: `/Users/lanemc/sites/serve-ai-marketing/lib/royals-leads-cache.ts`
  - Redis caching implementation
- **Database Migrations**: `/Users/lanemc/sites/serve-ai-marketing/supabase/migrations/20250627_create_royals_ticket_dip_tables.sql`
  - Database schema structure

#### 8. Utility Scripts
- **Cache Management**: 
  - `/Users/lanemc/sites/serve-ai-marketing/scripts/clear-royals-cache.js`
  - `/Users/lanemc/sites/serve-ai-marketing/scripts/populate-royals-cache.js`
- **Data Management**:
  - `/Users/lanemc/sites/serve-ai-marketing/scripts/clear-royals-data.js`
  - `/Users/lanemc/sites/serve-ai-marketing/scripts/check-royals-tables.js`

### AI Classification System

The app will use the same two-phase AI classification:

1. **Initial Classification** (`classifyLeadsWithLLM` function)
   - Location: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/api/route.ts` (lines 294-578)
   - Identifies Person vs Business vs Event Page
   - Excludes event/sponsor pages
   - Marks businesses for contact search
   - Quality scoring 1-10

2. **Final Person Filter** (`finalPersonFilterWithLLM` function)
   - Location: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/api/route.ts` (lines 581-706)
   - Ensures only actual people with names are kept
   - Additional confidence scoring
   - Final quality assurance

### Key Functions to Port

1. **Contact Extraction** (`extractContactInfo`)
   - Location: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/api/route.ts` (lines 27-165)
   - Extracts emails, phones, names, titles, companies from text

2. **Confidence Scoring** (`calculateConfidenceScore`)
   - Location: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/api/route.ts` (lines 271-293)
   - Assigns 0-100 score based on available contact information

3. **Regex Utilities** (`RegexUtils`)
   - Location: `/Users/lanemc/sites/serve-ai-marketing/scripts/regex-patterns.ts` (lines 48-136)
   - Pattern matching and extraction utilities

### Confidence Scoring Algorithm

```javascript
function calculateConfidenceScore(lead) {
  let score = 0;
  
  // High value indicators
  if (lead.contactEmail) score += 30;
  if (lead.contactPhone) score += 25;
  if (lead.contactName && lead.contactTitle) score += 20;
  if (lead.isPersonProfile) score += 15;
  
  // Medium value indicators
  if (lead.contactName) score += 10;
  if (lead.companyName) score += 5;
  if (lead.contactAddress) score += 8;
  if (lead.matchedKeywords.length > 3) score += 5;
  
  // Keyword quality
  if (lead.matchedKeywords.some(k => k.match(/CEO|President|Founder|Owner/i))) score += 10;
  if (lead.matchedKeywords.some(k => k.match(/sponsor|presenting sponsor/i))) score += 2;
  
  return Math.min(score, 100);
}
```

## CSV Format Specification

### Required Fields
- `url` - Source URL or LinkedIn profile
- `snippet` or `description` - Text content about the lead

### Optional Fields (Enhance Scoring)
- `contact_name` - Full name
- `contact_title` - Professional title
- `contact_email` - Email address
- `contact_phone` - Phone number
- `company_name` - Company/Organization
- `contact_address` - Physical address
- `keywords` - Comma-separated keywords

### Example CSV Structure
```csv
url,contact_name,contact_title,contact_email,contact_phone,company_name,snippet
https://linkedin.com/in/john-doe,John Doe,CEO,john@example.com,(913) 555-1234,ABC Corp,"John Doe is the CEO of ABC Corp in Kansas City..."
```

## User Interface Requirements

### Main Window
- Modern, clean interface matching Royals brand colors (#004687, #BD9B60)
- Drag-and-drop zone for CSV files
- Progress bar for processing
- Results table with sorting/filtering

### Processing View
- Real-time progress updates
- Current lead being processed
- Running statistics (processed, qualified, rejected)
- Cancel button for long operations

### Results View
- Sortable table with all processed leads
- Color-coded confidence scores
- Filter options (score ranges, has email, has phone)
- Export buttons for qualified/rejected leads

## API Integration

### Optional CRM Submission
- Configuration for API endpoint
- Authentication credentials storage (secure)
- Batch submission of qualified leads
- Error handling and retry logic

### Existing API Endpoints (for reference)
- **Main Scraper**: `POST /api/royals-ticket-dip` 
  - File: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/api/route.ts`
- **Get Leads**: `GET /api/royals-ticket-dip/leads`
  - File: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/api/leads/route.ts`
- **Update Lead**: `PATCH /api/royals-ticket-dip/lead/[id]`
  - File: `/Users/lanemc/sites/serve-ai-marketing/app/royals-ticket-dip/api/lead/[id]/route.ts`

### New Endpoint to Implement
```
POST /api/royals-ticket-dip/leads/bulk
{
  leads: LeadResult[],
  source: "electron-app",
  processedAt: timestamp
}
```

## Security Requirements

1. **API Key Storage**
   - Secure storage for OpenAI API key
   - Encrypted local storage using Electron safeStorage
   - Option to use environment variables

2. **Data Privacy**
   - No lead data stored permanently on device
   - Clear cache on app close option
   - GDPR-compliant data handling

## Performance Requirements

- Process 1,000 leads in under 5 minutes
- Handle CSV files up to 50MB
- Responsive UI during processing
- Efficient batching for API calls

## Distribution

### Packaging
- Windows: .exe installer
- macOS: .dmg or .app
- Auto-updater integration
- Code signing for trusted distribution

### Installation
- Simple one-click installer
- No admin privileges required
- Automatic dependency installation

## Development Phases

### Phase 1: Core Functionality
1. Electron app setup with React
2. CSV import and parsing
3. Basic UI with file upload
4. Integration of grading logic

### Phase 2: AI Integration
1. OpenAI API integration
2. Port classification functions
3. Implement batching for API calls
4. Add progress tracking

### Phase 3: Enhanced Features
1. Results filtering and export
2. API submission capability
3. Advanced configuration options
4. Performance optimizations

### Phase 4: Polish & Distribution
1. UI/UX improvements
2. Error handling enhancement
3. Auto-updater setup
4. Distribution package creation

## Configuration File

The app should support a `config.json` for admins:

```json
{
  "openai": {
    "apiKey": "sk-...",
    "model": "gpt-4o-mini",
    "temperature": 0.2
  },
  "processing": {
    "batchSize": 10,
    "maxConcurrent": 3,
    "retryAttempts": 3
  },
  "api": {
    "endpoint": "https://api.royals.com/leads",
    "authToken": "Bearer ..."
  },
  "scoring": {
    "thresholds": {
      "highValue": 80,
      "qualified": 60,
      "minimum": 40
    }
  }
}
```

## Supporting Documentation

### Existing Documentation Files
- **MVP Requirements**: `/Users/lanemc/sites/serve-ai-marketing/ROYALS_CRM_MVP.md`
- **Enhancements PRD**: `/Users/lanemc/sites/serve-ai-marketing/ROYALS_CRM_ENHANCEMENTS_PRD.md`
- **Scraper Documentation**: `/Users/lanemc/sites/serve-ai-marketing/ROYALS_SCRAPER_2.md`

### Database Schema
- **Tables**: `/Users/lanemc/sites/serve-ai-marketing/supabase/migrations/20250627_create_royals_ticket_dip_tables.sql`
  - `royals_report_history` - Stores scraping reports
  - `royals_leads` - Stores individual leads with scores

## Success Metrics

1. **Accuracy**: 95%+ match with web scraper grading
2. **Performance**: Process 200 leads/minute
3. **Usability**: < 5 clicks to process a CSV
4. **Reliability**: 99.9% uptime, graceful error handling

## Future Enhancements

1. **Lead Enrichment**: Additional data sources integration
2. **Duplicate Detection**: Identify existing CRM entries
3. **Scheduled Processing**: Watch folder for new CSVs
4. **Team Collaboration**: Multi-user support with roles
5. **Analytics Dashboard**: Historical processing stats