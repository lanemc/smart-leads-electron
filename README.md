# Smart Leads - Kansas City Royals Lead Qualifier

A desktop application built with Electron that allows the Kansas City Royals admin to bulk upload CSV files containing potential leads and have them automatically qualified/graded using AI-powered classification.

## Features

### Core Functionality
- **CSV Import**: Drag-and-drop CSV file upload interface with validation
- **AI-Powered Lead Classification**: Uses OpenAI GPT-4o-mini to classify leads as Person, Business, Event, or Unknown
- **Contact Information Extraction**: Automatically extracts emails, phones, names, titles, and companies using regex patterns
- **Confidence Scoring**: Assigns 0-100 confidence scores based on available contact information
- **Real-time Processing**: Shows progress with current lead being processed and running statistics
- **Results Filtering**: Filter by classification, score range, email/phone availability, and search terms
- **Export Functionality**: Export qualified leads to CSV with grading scores

### Security Features
- **Encrypted API Key Storage**: Uses Electron's safeStorage for secure credential management
- **Configuration Management**: Secure storage and loading of application settings
- **No Persistent Data Storage**: Lead data is only kept in memory during processing

### User Interface
- **Modern Design**: Material-UI components with Kansas City Royals theme colors (#004687, #BD9B60)
- **Responsive Layout**: Adapts to different window sizes
- **Drag-and-Drop**: Intuitive file upload experience
- **Progress Tracking**: Real-time updates during processing with cancel capability
- **Data Preview**: Shows preview of CSV data before processing

## Requirements

### CSV Format
The application accepts CSV files with the following structure:

#### Required Fields
- `url` - Source URL or LinkedIn profile
- `snippet` or `description` - Text content about the lead

#### Optional Fields (Enhance Scoring)
- `contact_name` - Full name
- `contact_title` - Professional title  
- `contact_email` - Email address
- `contact_phone` - Phone number
- `company_name` - Company/Organization
- `contact_address` - Physical address
- `keywords` - Comma-separated keywords

#### Example CSV
```csv
url,contact_name,contact_title,contact_email,contact_phone,company_name,snippet
https://linkedin.com/in/john-doe,John Doe,CEO,john@example.com,(913) 555-1234,ABC Corp,"John Doe is the CEO of ABC Corp in Kansas City..."
```

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18+)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 500MB available space
- **Network**: Internet connection required for AI processing

## Installation

### Option 1: Download Pre-built Binary
1. Go to the [Releases](https://github.com/lanemc/smart-leads-electron/releases) page
2. Download the appropriate version for your operating system:
   - **Windows**: `Smart-Leads-Setup-x.x.x.exe`
   - **macOS**: `Smart-Leads-x.x.x.dmg`
   - **Linux**: `Smart-Leads-x.x.x.AppImage`
3. Run the installer and follow the setup instructions

### Option 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/lanemc/smart-leads-electron.git
cd smart-leads-electron

# Install dependencies
npm install

# Build the application
npm run build

# Run the application
npm start

# Or run in development mode
npm run dev
```

## Configuration

### First-Time Setup
1. Launch the application
2. Click the Settings (⚙️) icon in the top-right corner
3. Enter your OpenAI API key (required for AI classification)
4. Adjust processing settings if needed:
   - **Batch Size**: Number of leads to process in each batch (default: 10)
   - **Max Concurrent**: Maximum concurrent API calls (default: 3)
   - **Retry Attempts**: Number of retry attempts for failed requests (default: 3)
5. Set scoring thresholds:
   - **High Value**: Threshold for high-value leads (default: 80)
   - **Qualified**: Threshold for qualified leads (default: 60)
   - **Minimum**: Minimum threshold for keeping leads (default: 40)

### OpenAI API Key
- Sign up at [OpenAI](https://openai.com/api/)
- Generate an API key in your account dashboard
- The key is stored securely using Electron's encrypted storage
- The application uses the GPT-4o-mini model for cost-effective processing

## Usage

### Basic Workflow
1. **Import CSV**: Drag and drop a CSV file or click "Browse" to select one
2. **Preview Data**: Review the imported data in the preview table
3. **Configure Settings**: Ensure your OpenAI API key is set up
4. **Process Leads**: Click "Process Leads" to start AI classification
5. **Monitor Progress**: Watch real-time progress with current lead and statistics
6. **Review Results**: Filter and review the classified leads
7. **Export**: Export qualified leads to CSV for further use

### Processing Details
The application uses a two-phase AI classification system:

1. **Initial Classification**: 
   - Identifies Person vs Business vs Event Page
   - Excludes event/sponsor pages automatically
   - Marks businesses for contact search
   - Assigns quality scoring 1-10

2. **Contact Extraction**:
   - Extracts emails, phones, names, titles using regex patterns
   - Calculates confidence scores based on available information
   - Applies keyword matching for quality assessment

3. **Final Scoring**:
   - Combines AI quality score with confidence score
   - Filters leads below minimum threshold
   - Categorizes as High Value, Qualified, or Rejected

### Performance
- Processes approximately 200 leads per minute (depending on API response times)
- Handles CSV files up to 50MB
- Supports up to 10,000+ leads in a single batch
- Real-time progress updates with cancellation capability

## Troubleshooting

### Common Issues

**"Invalid API key format" Error**
- Ensure your OpenAI API key starts with 'sk-' and is at least 20 characters
- Verify the key is active in your OpenAI account

**"CSV parsing errors" Message**
- Check that your CSV has 'url' and 'snippet'/'description' columns
- Ensure there are no empty URL values
- Verify the file is properly formatted CSV

**Slow Processing**
- Reduce batch size in settings (try 5 instead of 10)
- Reduce max concurrent requests (try 1 or 2)
- Check your internet connection speed

**Application Won't Start**
- Make sure all dependencies are installed (`npm install`)
- Try clearing the configuration: delete the `.smart-leads` folder in your home directory
- Check the console for error messages

### Log Files
- **Development**: Console logs are visible in the developer tools
- **Production**: Logs are written to the system's standard log directory
- **Configuration**: Stored in `~/.smart-leads/` (macOS/Linux) or `%USERPROFILE%\.smart-leads\` (Windows)

## Development

### Project Structure
```
smart-leads-electron/
├── src/
│   ├── main.ts                 # Electron main process
│   ├── preload.ts             # Preload script for security
│   ├── renderer.tsx           # React app entry point
│   ├── index.html            # HTML template
│   ├── renderer/             # React components
│   │   ├── App.tsx
│   │   └── components/
│   ├── shared/               # Shared utilities
│   │   ├── services/         # Business logic
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Utility functions
│   └── __tests__/           # Test files
├── assets/                   # Icons and resources
├── webpack.*.config.js      # Build configuration
├── package.json
└── README.md
```

### Available Scripts
- `npm start` - Run the built application
- `npm run dev` - Development mode with hot reload
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checking
- `npm run package` - Create distributable packages

### Testing
The application uses Jest and React Testing Library for testing:
- **Unit tests**: Individual component and service testing
- **Integration tests**: Component interaction testing
- **E2E tests**: Full application workflow testing

Run tests with:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Building for Distribution
```bash
# Build for all platforms
npm run package

# Build for specific platforms
npm run package:win   # Windows
npm run package:mac   # macOS
npm run package:linux # Linux
```

## License
This project is proprietary software developed for the Kansas City Royals organization.

## Support
For technical support or feature requests, please contact the development team or create an issue in the GitHub repository.

## Version History
- **v1.0.0** - Initial release with core functionality
  - CSV import and AI-powered lead classification
  - Secure configuration management
  - Export functionality with filtering
  - Material-UI interface with Royals theming