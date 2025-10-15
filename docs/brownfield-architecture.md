# Insurance Data Entry Form Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the Insurance Data Entry Form codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements.

### Document Scope

Comprehensive documentation of entire system (single-file web application)

### Change Log

| Date       | Version | Description                 | Author  |
| ---------- | ------- | --------------------------- | ------- |
| 2025-10-15 | 1.0     | Initial brownfield analysis | Winston |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `Data Form-1.html` (single file containing all HTML, CSS, and JavaScript)
- **Sample Data**: `insurance_form_data_2025-09-17.json` (exported data example)
- **Documentation**: `README.md` (basic setup and features)

### Enhancement Impact Areas

Refactoring focus: Code modularization, redundancy removal, testing implementation

## High Level Architecture

### Technical Summary

Single-page web application built with vanilla JavaScript, HTML5, and Tailwind CSS. All application logic, styling, and markup are contained in a single HTML file. Data persistence uses browser localStorage. Includes AI integration for policy summaries via Google Gemini API.

### Actual Tech Stack (from codebase analysis)

| Category    | Technology                  | Version/Notes                      |
| ----------- | --------------------------- | ---------------------------------- |
| Runtime     | Browser (Chrome/Edge/etc)   | Modern browsers with ES6+ support |
| Framework   | None (Vanilla JavaScript)   | No frameworks used                 |
| Styling     | Tailwind CSS                | CDN: https://cdn.tailwindcss.com   |
| AI Service  | Google Gemini               | 2.5-flash-preview-05-20            |
| Storage     | localStorage                | Browser API, client-side only      |
| Fonts      | Google Fonts Inter         | https://fonts.googleapis.com/css2?family=Inter |

### Repository Structure Reality Check

- **Type**: Single file application
- **Package Manager**: None
- **Build System**: None
- **Deployment**: Static file hosting
- **Notable**: Everything in one HTML file - easy to deploy but hard to maintain

## Source Tree and Module Organization

### Project Structure (Actual)

```
DataSheet/
├── Data Form-1.html                    # ENTIRE APPLICATION (HTML + CSS + JS)
├── insurance_form_data_2025-09-17.json # Sample exported data
└── README.md                           # Basic documentation
```

### Key Modules and Their Purpose

Since everything is in one file, modules are conceptual sections within the JavaScript:

- **Data Management**: `getStoredData()`, `exportDataAsJSON()`, `importDataFromJSON()` - localStorage operations
- **Form Handling**: Multi-tab form with `showFormTab()`, `validateTab()`, `navigateFormTab()`
- **UI Components**: Modals (`openModal`, `closeModal`), tables (`renderDataTable()`), repeaters (nominees, policies, siblings)
- **Validation**: Custom validation for Aadhaar/PAN, age calculations, nominee shares
- **AI Integration**: `callGeminiAPI()`, `generateSummary()` - Gemini API calls
- **Utilities**: Age calculation, currency formatting, visibility toggles

## Data Models and APIs

### Data Models

Data is stored as JSON objects in localStorage under key 'formData'. Each record contains 90+ fields defined in the `CSV_HEADERS` array.

**Key Data Categories**:
- Personal Info: name_of_la, proposer, aadhaar, pan, ckyc, abha, f_name, m_name, gender, dob
- Contact: mobile, whatsapp, email, address
- Financial: a_income, ly_income1-3, bank details, premium
- Family History: parents, spouse, siblings, children with health status
- Insurance: plan_term, sum_assured, nominees, previous_policies

**Data Structure Reality**:
- No formal schema - fields defined in CSV_HEADERS array
- Nested arrays for repeaters (nominees, previous_policies, brothers, sisters, children)
- Mixed data types (strings, numbers, dates)
- Some fields conditionally required based on other field values

### API Specifications

- **Gemini AI API**: REST endpoint for generating policy summaries
  - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent`
  - Method: POST
  - Payload: `{ contents: [{ parts: [{ text: prompt }] }] }`
  - Requires API key in query parameter

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Single File Architecture**: All code (HTML, CSS, JS) in one 2800+ line file - extremely hard to maintain
2. **Code Redundancy**: Massive duplication in repeater logic (siblings, children, nominees, policies)
3. **No Modularization**: Functions are global, no separation of concerns
4. **Mixed Concerns**: Business logic mixed with DOM manipulation
5. **No Error Handling**: Minimal try/catch blocks, silent failures
6. **Hardcoded Values**: API key placeholder, magic numbers throughout
7. **No Testing**: Zero automated tests, manual testing only
8. **Security Issues**: API key exposure risk, no input sanitization
9. **Performance**: Large script block, no code splitting or lazy loading
10. **Accessibility**: Basic keyboard navigation but missing ARIA labels

### Workarounds and Gotchas

- **API Key Setup**: Must manually replace empty API_KEY variable - no environment config
- **localStorage Limits**: Browser storage limits (~5-10MB) not handled
- **Validation Bypass**: Custom validation prevents browser native validation
- **Date Handling**: Manual date calculations without proper timezone handling
- **Currency Formatting**: Custom Indian number formatting, no internationalization
- **Modal Scrolling**: Manual scroll-to-top on modal open/close
- **Form Reset**: Manual clearing of dependent fields when visibility changes

## Integration Points and External Dependencies

### External Services

| Service     | Purpose                  | Integration Type | Key Integration Points          |
| ----------- | ------------------------ | ---------------- | ------------------------------- |
| Google Gemini | Generate policy summaries | REST API         | `callGeminiAPI()` function      |
| Google Fonts | Typography              | CDN              | Inter font family               |
| Tailwind CSS | Styling framework       | CDN              | Utility classes                 |

### Internal Integration Points

- **localStorage**: Primary data persistence
- **Browser APIs**: Clipboard, FileReader for import/export
- **DOM APIs**: Extensive DOM manipulation for dynamic UI

## Development and Deployment

### Local Development Setup

1. Open `Data Form-1.html` in any modern web browser
2. No additional setup required
3. For AI features: Obtain Gemini API key and replace `API_KEY` variable

### Build and Deployment Process

- **Build**: No build step required
- **Deployment**: Copy `Data Form-1.html` to web server
- **Environment**: Single environment (production is same as development)
- **Updates**: Manual file replacement

### Development Workflow Reality

- Edit HTML file directly
- Test by refreshing browser
- No version control integration shown
- No automated deployment

## Testing Reality

### Current Test Coverage

- **Unit Tests**: None
- **Integration Tests**: None
- **E2E Tests**: None
- **Manual Testing**: Primary testing method
- **Coverage**: 0% automated coverage

### Testing Approach

- Manual form filling and validation
- Manual data export/import testing
- Browser console debugging
- No test framework or scripts

## Enhancement Impact Analysis

### Refactoring Focus Areas

Based on user requirements, these areas need immediate refactoring:

#### 1. Code Modularization
- **Current State**: All JavaScript in one `<script>` block
- **Target State**: Separate modules for data, UI, validation, AI
- **Impact**: Break into multiple files or at least separate functions

#### 2. Redundancy Removal
- **Current State**: Repeater logic duplicated 4+ times (siblings, children, nominees, policies)
- **Target State**: Generic repeater component
- **Impact**: Reduce code by ~40%

#### 3. Testing Implementation
- **Current State**: No tests
- **Target State**: Unit tests for utilities, integration tests for forms
- **Impact**: Jest or similar framework needed

#### 4. Security Improvements
- **Current State**: API key exposed, no sanitization
- **Target State**: Environment variables, input validation
- **Impact**: Move to server-side or secure key management

#### 5. Performance Optimization
- **Current State**: Large single file
- **Target State**: Code splitting, lazy loading
- **Impact**: Multiple script files or bundler

### Files That Will Need Modification

- `Data Form-1.html` - Split into multiple files
- New files: `js/data.js`, `js/ui.js`, `js/validation.js`, `js/ai.js`
- New files: `css/styles.css` (extract inline styles)
- New files: `test/` directory with test files

### New Files/Modules Needed

- `js/utils.js` - Shared utilities (formatting, calculations)
- `js/components/` - Reusable UI components
- `js/services/` - Data and API services
- `test/unit/` - Unit test files
- `test/integration/` - Integration tests
- `docs/api.md` - API documentation
- `config/env.js` - Environment configuration

### Integration Considerations

- Maintain backward compatibility with existing localStorage data
- Preserve all current functionality during refactoring
- Keep same UI/UX during modularization
- Ensure AI features remain optional

## Appendix - Useful Commands and Scripts

### Development Commands

```bash
# No build commands - just open in browser
start chrome "Data Form-1.html"  # Windows
open Data Form-1.html            # macOS
```

### Debugging

- Use browser DevTools console
- Check localStorage in Application tab
- Network tab for API calls

### Data Management

- Export: Click "Export JSON" button
- Import: Click "Import JSON" button
- Clear: Click "Clear All Data" button

## Success Criteria

- Single comprehensive brownfield architecture document created
- Document reflects REALITY including technical debt and workarounds
- Key files and modules are referenced with actual paths
- Models/APIs reference source files rather than duplicating content
- Clear refactoring impact analysis showing what needs to change
- Document enables AI agents to navigate and understand the actual codebase
- Technical constraints and "gotchas" are clearly documented