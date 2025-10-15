# Technical Debt and Known Issues

## Critical Technical Debt

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

## Workarounds and Gotchas

- **API Key Setup**: Must manually replace empty API_KEY variable - no environment config
- **localStorage Limits**: Browser storage limits (~5-10MB) not handled
- **Validation Bypass**: Custom validation prevents browser native validation
- **Date Handling**: Manual date calculations without proper timezone handling
- **Currency Formatting**: Custom Indian number formatting, no internationalization
- **Modal Scrolling**: Manual scroll-to-top on modal open/close
- **Form Reset**: Manual clearing of dependent fields when visibility changes