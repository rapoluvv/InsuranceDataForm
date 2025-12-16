# Insurance Data Entry Form

A comprehensive web-based application for collecting and managing insurance policy data with local storage, data encryption, and AI-powered features.

## Features

### Core Functionality
- **Multi-step form** with 8 wizard tabs for comprehensive data collection:
  - Applicant Details (name, Aadhaar, PAN, personal information)
  - Contact & Personal Details (mobile, email, address, residential status)
  - Education & Qualification (education, job, income details)
  - Proposed Plan (plan details, premium, policy information)
  - Nominee & Appointee Details (dynamic nominee repeater with share validation)
  - Bank Details (account information and codes)
  - Family & Medical Details (parents, spouse, siblings, children, medical history)
  - Previous Policy Details (multi-policy repeater with historical policy data)
  - Review & Submit (comprehensive data summary and submission)

### Data Management
- **Draft Support**: Save and resume incomplete forms mid-session
- **Local Storage**: Data persists in browser using localStorage
- **Data Encryption**: Client-side AES-GCM encryption for sensitive fields (Aadhaar, PAN, bank details)
- **Export/Import**: JSON export and import functionality for data backup and migration
- **Search & Filter**: Find records by name or policy number

### User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices using Tailwind CSS
- **Dark Mode**: Theme toggle with system preference detection
- **Interactive Wizard**: Stepper navigation with progress indicators
- **Data Table**: Submitted and draft records with sortable columns and actions
- **Modals**: Detailed row view, AI summary display, and confirmation dialogs

### Validation & Accessibility
- **Real-time Validation**: 
  - Aadhaar validation (12 digits with optional spacing)
  - PAN validation (AAAAA9999A format)
  - Email and mobile number validation
  - Required field checking
  - Nominee share validation (must total 100%)
- **Accessibility Features**:
  - Keyboard navigation (Ctrl+Arrow keys between form tabs)
  - ARIA labels and semantic HTML
  - Error messages with context
  - Focus management

### Smart Features
- **Conditional Visibility**: Form fields show/hide based on user inputs (e.g., spouse fields for married users, pregnancy details for females)
- **Dynamic Repeaters**: Add/remove nominees, previous policies, and family members dynamically
- **Age Auto-calculation**: Automatically calculates age from date of birth
- **Currency Formatting**: Indian number formatting for income fields
- **AI-powered Summaries**: Generate professional client summaries using Google Gemini API (optional)

## Project Structure

```
InsuranceDataForm/
├── index.html                 # Main HTML file with form structure
├── css/
│   └── styles.css            # Comprehensive styling with dark mode support
├── js/
│   ├── loader.js             # Module loader for all JS files
│   ├── init.js               # Application initialization
│   ├── app.js                # Form tabs, navigation, repeaters, and form logic
│   ├── ui.js                 # UI components, modals, table rendering
│   ├── validation.js         # Field validation and error handling
│   ├── data.js               # localStorage management with encryption/decryption
│   ├── ai.js                 # Google Gemini API integration
│   ├── review.js             # Review panel rendering
│   ├── utils.js              # Utility functions
├── assets/
│   ├── favicon.ico           # Browser tab icon
│   └── lic_logo.png          # Company logo
├── docs/
│   └── features-to-be-implemented.md  # Future enhancement roadmap
└── README.md                 # This file
```

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Tailwind CSS with custom design system
- **Data Storage**: Browser localStorage with Web Crypto API encryption
- **AI Integration**: Google Gemini 2.0 Flash API
- **Encryption**: AES-GCM with PBKDF2 key derivation

## Setup & Usage

1. **Open the application**:
   ```bash
   # Simply open index.html in a modern web browser
   # No build process or server required for basic functionality
   ```

2. **Enable AI features** (optional):
   - Obtain a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Replace the `API_KEY` variable in `js/ai.js` with your key
   - Note: API key is currently exposed in client-side code. For production, implement a server-side proxy.

3. **Use the application**:
   - Fill in applicant details through the multi-step wizard
   - Switch between tabs using the stepper navigation
   - Add nominees and previous policies using the repeater buttons
   - Review your data in the Review tab before submission
   - Save as draft to resume later
   - View submitted data in the data table
   - Export data as JSON for backup

## Data Encryption & Security

### Encrypted Fields
The following sensitive fields are encrypted before storage:
- Aadhaar numbers
- PAN numbers
- Bank account numbers
- IFSC and MICR codes
- Nominee Aadhaar numbers

### Encryption Implementation
- **Algorithm**: AES-GCM (Advanced Encryption Standard with Galois/Counter Mode)
- **Key Size**: 256-bit
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **Storage**: Encrypted data stored as base64 in localStorage

### Security Limitations & Recommendations

⚠️ **For Production Use**:
- Implement server-side data storage instead of browser localStorage
- Use secure authentication and user management
- Implement server-side data encryption
- Protect API keys with a server-side proxy
- Add HTTPS/TLS encryption for data in transit
- Implement regular security audits and penetration testing
- Add audit logs for data access and modifications
- Consider GDPR/data privacy compliance requirements

## Form Fields & Data Model

### Applicant Details Tab
- Name of Life Assured (required)
- Proposer Name
- Aadhaar (required, 12-digit validation)
- CKYC, ABHA, PAN
- Father's/Mother's Name
- Gender (required: Male/Female/Trans)
- Marital Status (required: Yes/No)
- Spouse details (conditionally required if married)

### Contact & Personal Details Tab
- Mobile numbers (Aadhaar & additional)
- Email and WhatsApp
- Date of Birth (required)
- Birth Place
- Age (auto-calculated)
- Residential Status
- KYC and Correspondence Addresses

### Education & Qualification Tab
- Education level
- Current Job and Job Type
- Company Name and tenure
- Total Experience
- Annual Income and Last 3 Years Income
- Husband details (for female applicants)

### Proposed Plan Tab
- Plan/Term (required)
- PPT (Premium Payment Term)
- Mode (Yearly/Half-Yearly/Quarterly/NACH/Single)
- Sum Assured
- Accidental Benefit (AB/ADDB)
- Term Rider
- Premium (required)
- Dating Back (with date if applicable)
- PWB, BOC, and Policy details

### Nominee & Appointee Tab
- Multiple Nominees with dynamic repeater:
  - Name, Share %, DOB, Relation, Aadhaar
  - Share validation (must total 100%)
- Appointee details (Name, Relation, Age)

### Bank Details Tab
- Bank Name, Account Type
- Account Holder Name
- Bank Address
- Account Number, MICR Code, IFSC Code

### Family & Medical Details Tab
- **Family Information**:
  - Father/Mother/Spouse: Age, State of Health, Death Details (if deceased)
  - Siblings and Children counts with dynamic repeater
  - Sibling death details when applicable
  - Child death details when applicable
- **Medical Information**:
  - Height, Weight, Abdomen measurement
  - Operations history
  - Disease history
  - Pregnancy details (for females)
  - Last delivery date (for females with children)

### Previous Policy Tab
- Multiple previous policies with repeater:
  - Policy Number, Branch
  - Plan/Term, Sum Assured, Premium
  - Mode, Accidental Benefit
  - Date of Commencement
  - Rate type (Ordinary/Special)
  - Medical/Non-Medical
  - Inforce Status

## Implemented Features

- ✅ Multi-step wizard form with 9 tabs
- ✅ Dynamic form repeaters for nominees, policies, family members
- ✅ Conditional field visibility based on user inputs
- ✅ Real-time validation with error messages
- ✅ Age auto-calculation from DOB
- ✅ Draft saving and resuming
- ✅ Data encryption (AES-GCM)
- ✅ Local storage persistence
- ✅ JSON export/import
- ✅ Data table with submitted/draft tabs
- ✅ Row details modal with tabbed content
- ✅ Search and filter functionality
- ✅ Dark mode with system preference
- ✅ Responsive design
- ✅ AI-powered summaries (Gemini API)
- ✅ Comprehensive data model with 100+ fields
- ✅ Toast notifications
- ✅ Confirmation modals for destructive actions

## Future Enhancements

See [features-to-be-implemented.md](docs/features-to-be-implemented.md) for detailed roadmap:

- Animated transitions and motion preferences support
- Dashboard with KPIs and analytics
- Customer-level aggregation and summaries
- Paginated data table with sorting and filtering
- Server-side data storage and authentication
- Bulk data operations and export (CSV/PDF)
- Duplicate detection and smart autofill
- Automated reminders and status management
- Accessibility enhancements (WCAG 2.1 AA compliance)
- Unit and integration tests
- Performance optimization for large datasets

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

Requires support for:
- ES6+ JavaScript features
- Web Crypto API
- CSS Grid and Flexbox
- LocalStorage API
- File API (for import/export)

## Performance Considerations

- Application loads all data into memory for small to medium datasets (<10k records)
- Encryption/decryption operations are asynchronous to prevent UI blocking
- Form validation is real-time with debouncing
- CSS animations use hardware-accelerated properties
- Dark mode preference is cached in localStorage

## Development Notes

- **Modular Architecture**: JavaScript split into focused modules (app, ui, validation, data, ai)
- **Async Operations**: Data loading, encryption, and API calls use Promises/async-await
- **Error Handling**: Try-catch blocks with fallbacks for graceful degradation
- **Browser Compatibility**: Uses Web APIs compatible with modern browsers
- **No Build Tools**: Pure vanilla JavaScript with no build process required

## License & Credits

- Built with Vanilla JavaScript, HTML5, CSS3
- Styled with Tailwind CSS
- Icons and imagery as specified in assets
- Form designed for insurance policy data collection