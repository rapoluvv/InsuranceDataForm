# High Level Architecture

## Technical Summary

Single-page web application built with vanilla JavaScript, HTML5, and Tailwind CSS. All application logic, styling, and markup are contained in a single HTML file. Data persistence uses browser localStorage. Includes AI integration for policy summaries via Google Gemini API.

## Actual Tech Stack (from codebase analysis)

| Category    | Technology                  | Version/Notes                      |
| ----------- | --------------------------- | ---------------------------------- |
| Runtime     | Browser (Chrome/Edge/etc)   | Modern browsers with ES6+ support |
| Framework   | None (Vanilla JavaScript)   | No frameworks used                 |
| Styling     | Tailwind CSS                | CDN: https://cdn.tailwindcss.com   |
| AI Service  | Google Gemini               | 2.5-flash-preview-05-20            |
| Storage     | localStorage                | Browser API, client-side only      |
| Fonts      | Google Fonts Inter         | https://fonts.googleapis.com/css2?family=Inter |

## Repository Structure Reality Check

- **Type**: Single file application
- **Package Manager**: None
- **Build System**: None
- **Deployment**: Static file hosting
- **Notable**: Everything in one HTML file - easy to deploy but hard to maintain