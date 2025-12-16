# Features to Be Implemented

This document breaks each high-level improvement into focused subsections with concise implementation notes, acceptance criteria, and additional suggestions where useful.

## 1. Animate data-tab changes & motion preferences (Not implementing any more)

Problem: view changes are abrupt and provide limited feedback.

Goals and suggested features:
- Smooth transitions when switching views or updating lists (CSS transitions or small JS animations).
- Respect the user OS-level "reduced motion" preference and provide non-animated fallbacks.
- Micro-interactions for row actions (remind, delete) to confirm intent.

Implementation notes:
- Use CSS transforms/opacities and hardware-accelerated properties; avoid layout-thrashing animations.
- Acceptance: animations are subtle, optionally disabled by preference, and do not impair accessibility.

## 2. Support draft saving mid-form

Problem: users can lose progress; no resume/draft support exists.

Goals and suggested features:
- Autosave form state (fields + active tab/stepper) to sessionStorage/localStorage or IndexedDB.
- Resume draft option on the View tab and a clear discard confirmation.
- Draft versioning or timestamps and optional named drafts per user.

Implementation notes:
- Define a stable storage key and a small schema with versioning and lastEdited timestamp.
- Autosave interval (e.g., 5–10s or onchange debounce) and a manual Save Draft action.
- Acceptance: users can close/reopen and resume at the same tab/step without loss.

### Drafts panel in View data tab

- Surface a dedicated draft listing above (or beside) the submitted data table, showing rows whose `status` is `draft`.
- Reuse the table-like cards from the main list but scope them to drafts; add contextual actions such as “Continue editing” (reuse `editRow`) and “Discard draft” with confirmation.
- Keep submitted records in the existing table by filtering out drafts, and optionally provide counts/badges for draft vs submitted totals.
- Search/filter inputs should respect both sections (e.g., apply the query to drafts individually) so users can locate a saved draft quickly.
- Transitioning a draft to submitted should re-render both sections so the record disappears from the draft panel and, if needed, appears in the main table with a new status.

## 3. Introduce a form summary / review step

Problem: users only see their inputs after submitting.

Goals and suggested features:
- A Review panel (sticky sidebar or final wizard tab) showing headings and filled values.
- Highlight missing or invalid mandatory inputs and provide inline edit links to jump back.

Implementation notes:
- Reuse CSV_HEADERS to drive the summary rendering and reuse validation routines to flag issues.
- Provide an Edit action per row that focuses the related input/tab.
- Acceptance: users can see all values, fix issues after the review, and submit successfully.

## 4. Boost validation & accessibility support

Problem: validation.js reports errors inline but lacks accessible hints and real-time guidance.

Goals and suggested features:
- Inline helper text and contextual examples (Aadhaar/PAN formats, accepted ranges).
- aria-live announcements for validation results and a visible error summary for keyboard users.
- Real-time (debounced) validation as users type and clear visual/ARIA states when fixed.
- Disable or visually mark Next buttons until current tab validates; surface keyboard shortcuts via showToast.

Implementation notes:
- Extend validation module to return structured results { field, message, level } and expose a summary API.
- Add unit/interaction tests for keyboard-only flows and screen-reader announcements.
- Acceptance: screen readers announce validation changes; required flows cannot progress until valid.

## 5. Turn the flat data table into a proper dashboard

Problem: renderDataTable in ui.js writes a static <table> and the filter function hides rows, which does not scale.

Goals and suggested features:
- Server-side or IndexedDB-backed pagination with configurable page size and fast count estimates.
- Sortable columns (single & multi-column), column visibility toggles and column re-ordering.
- Summary strip above the table: record counts, total premiums, policy mix (by product/type/status).
- Aggregated KPI cards: total sum assured, high-premium alerts, duplicate candidates.
- Export/print capabilities (CSV / PDF) and bulk actions (mark, delete, export selected).

Implementation notes:
- Add an abstraction in DataModule for paginated queries (offset/limit or cursor), with optional filters/sorts.
- Keep UI rendering incremental (virtualized list or windowing) for very large datasets.
- Acceptance: table supports 10k+ rows without freezing, sorting/paging reflect immediately, KPI cards update with filters.

## 6. KPIs & analytics within the dashboard

Problem: lack of visual metrics to evaluate submissions and trends.

Goals and suggested features:
- KPI cards: submission rate, average premium, total sum assured, duplicate rate, common validation errors.
- Time-series charts (Chart.js or D3) with filterable ranges and breakdowns by product/status.
- Exportable reports and simple filtering controls for date ranges, product types, and agents.

Implementation notes:
- Compute KPIs server-side or via IndexedDB aggregates; cache results for short windows to improve responsiveness.
- Acceptance: KPIs update according to filters and time ranges, and charts render without blocking the UI.

## 7. Smart autofill & duplicate detection

Problem: no pre-population or duplicate detection for repeated Aadhaar/PAN entries.

Goals and suggested features:
- Smart autofill that pre-populates fields when similar Aadhaar/PAN/phone exists.
- Fuzzy matching and confidence scores, with a confirmation step before overwriting.
- Duplicate highlight before submission and a merge/skip workflow.

Implementation notes:
- Use DataModule.getStoredData() and add efficient indexes (hash or normalized keys) to search.
- Preserve an audit trail when autofill replaces or merges data; surface privacy considerations.
- Acceptance: autofill speeds repeat entries and prevents accidental duplicates.

## 8. Build the dashboard around customer summaries (aggregate view)

Problem: raw policy rows make it hard to see customer-level status and totals.

Goals and suggested features:
- Aggregate records to customer-level summaries keyed by Aadhaar/PAN (or normalized name when missing).
- Customer card/row: Customer Name, Policies (count), Total Premium, Total Sum Assured, and status badges.
- Clickable customer cards to open a Customer Detail route/drawer with all underlying policies, nominees, reminders, and change history.
- Filters/search that operate on customer-level aggregates (e.g., customers with >1 policy, high total premium).

Implementation notes:
- Add DataModule.getCustomerSummaries() and associated helpers; normalize keys and maintain an index for fast lookup.
- Consider a background aggregation task or materialized aggregate to avoid heavy on-the-fly computation.
- Acceptance: customer-level view loads quickly, drill-down shows the correct underlying policies, and filters work on aggregates.

## 9. Automated reminders / resubmission cues

Problem: no built-in follow-up state for entries pending actions.

Goals and suggested features:
- Add a status field (draft, pending medical, pending docs, active, completed) per record.
- Dashboard badges/counts for pending items and per-row action buttons (remind, escalate, mark complete).
- Schedule reminders (in-app badge, email hooks) and maintain an activity log.

Implementation notes:
- Extend DataModule to store status and timestamps; expose query helpers for status counts.
- Provide an API or integration point for external notifications (email/webhook) if required.
- Acceptance: staff can see pending items, send reminders, and update statuses from the dashboard.

---

Notes on rollout & testing:
- Implement features incrementally and keep backwards-compatible DataModule APIs.
- Add unit tests for validation, data access helpers, and integration tests for the dashboard flows.
- Prioritize accessibility and performance (mobile and low-end devices) during implementation.