# Integration Points and External Dependencies

## External Services

| Service     | Purpose                  | Integration Type | Key Integration Points          |
| ----------- | ------------------------ | ---------------- | ------------------------------- |
| Google Gemini | Generate policy summaries | REST API         | `callGeminiAPI()` function      |
| Google Fonts | Typography              | CDN              | Inter font family               |
| Tailwind CSS | Styling framework       | CDN              | Utility classes                 |

## Internal Integration Points

- **localStorage**: Primary data persistence
- **Browser APIs**: Clipboard, FileReader for import/export
- **DOM APIs**: Extensive DOM manipulation for dynamic UI