# Source Tree and Module Organization

## Project Structure (Actual)

```
DataSheet/
├── Data Form-1.html                    # ENTIRE APPLICATION (HTML + CSS + JS)
├── insurance_form_data_2025-09-17.json # Sample exported data
└── README.md                           # Basic documentation
```

## Key Modules and Their Purpose

Since everything is in one file, modules are conceptual sections within the JavaScript:

- **Data Management**: `getStoredData()`, `exportDataAsJSON()`, `importDataFromJSON()` - localStorage operations
- **Form Handling**: Multi-tab form with `showFormTab()`, `validateTab()`, `navigateFormTab()`
- **UI Components**: Modals (`openModal`, `closeModal`), tables (`renderDataTable()`), repeaters (nominees, policies, siblings)
- **Validation**: Custom validation for Aadhaar/PAN, age calculations, nominee shares
- **AI Integration**: `callGeminiAPI()`, `generateSummary()` - Gemini API calls
- **Utilities**: Age calculation, currency formatting, visibility toggles