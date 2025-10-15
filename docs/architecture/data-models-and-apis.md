# Data Models and APIs

## Data Models

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

## API Specifications

- **Gemini AI API**: REST endpoint for generating policy summaries
  - URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent`
  - Method: POST
  - Payload: `{ contents: [{ parts: [{ text: prompt }] }] }`
  - Requires API key in query parameter