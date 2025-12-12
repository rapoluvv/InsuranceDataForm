# Insurance Data Entry Form

A web-based application for collecting and managing insurance policy data.

## Features

- Multi-step form with 7 tabs for comprehensive data collection
- Progress indicator showing completion status
- Data validation with custom rules for Aadhaar and PAN
- Local storage for data persistence
- Search and filter functionality in data view
- Export/import data as JSON
- AI-powered summary generation (requires API key)
- Responsive design using Tailwind CSS

## Setup

1. Open `index.html` in a web browser
2. No additional setup required for basic functionality

## API Integration

To enable AI summary generation:
1. Obtain a Google Gemini API key
2. Replace the empty `API_KEY` variable in the JavaScript section with your key

## Security Note

This application stores data locally in the browser using localStorage. For production use:
- Implement server-side data storage
- Add data encryption
- Use secure authentication

## Improvements Made

- Added progress bar for form navigation
- Enhanced form validation with regex for IDs
- Added search functionality in data table
- Improved keyboard accessibility (Ctrl+Arrow keys for navigation)
- Added security warnings
- Better error handling

## Future Enhancements

- Server-side data storage
- User authentication
- Bulk data operations
- Automated testing
- Code modularization