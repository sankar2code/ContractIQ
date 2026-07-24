# Spec: Results Display — Key Terms Panel + PDF Viewer (US-003, US-004, US-006, US-011-partial)

Source: `docs/engineering/engineering-doc.md` §4.3, §5, §9.

## Overview

The two-panel results page: an interactive PDF viewer (or text-viewer fallback) on the left, the key terms list on the right, with click-to-navigate wiring between them.

## Technical Requirements

- Time to first extracted key-term display ≤ 30s P95 for ≤ 20-page contracts (PRD §5).
- PDF signed URLs expire after 1 hour and must be refreshed transparently, not via a full page reload (PRD §5/§6, engineering-doc §7).
- WCAG 2.1 AA: color is never the only signal on `ConfidenceBadge`; keyboard-navigable page links; visible focus rings.
- Responsive: two-panel layout collapses to stacked/tabbed below 768px viewport width.
- The "Not legal advice" disclaimer must be present on every results page (PRD §9/§11).

## User Flow

1. User opens `/contracts/{id}` (from dashboard, or redirect after processing).
2. Page fetches `GET /api/contracts/{id}` — contract metadata, all `key_terms`, and `signed_url` (or `null`).
3. Left panel renders `PdfViewer` (if `signed_url` present) or `TextViewerFallback` (if not), both accepting a shared `targetPage: number | null` prop.
4. Right panel renders `KeyTermsPanel`: each row shows term name, value, page number (clickable), `ConfidenceBadge`.
5. Clicking a page number sets `targetPage`, which both viewer components respond to (smooth-scroll + highlight the relevant span/section).
6. Terms with `confidence_score < 50` show a ⚠️ icon; hovering/focusing shows the non-dismissible tooltip "Low confidence — we recommend verifying this in the document directly," and the viewer auto-highlights the nearest matching page span.
7. Each term has an expandable "Why?" control revealing `source_sentence` verbatim.
8. The "Not legal advice" disclaimer renders once, persistently, at the top of the results page.

## Database

Read-only: `contracts`, `key_terms`. No writes in this spec (writes are covered by spec 05 — inline editing).

## DB Tasks

None.

## API Routes

### `GET /api/contracts/{id}`

- **Auth:** required, must own contract (else `404`)
- **Response `200`:** `{ contract: Contract, key_terms: KeyTerm[], signed_url: string | null }`
- `signed_url` is generated server-side via the service-role client (1-hour expiry) only if `contract.file_path is not null`.

### `GET /api/contracts/{id}/signed-url`

- **Auth:** required, must own contract
- **Purpose:** client calls this to refresh an expired signed URL without a full page reload (PDF.js viewer catches a 403 on the PDF fetch and calls this).
- **Response `200`:** `{ signed_url: string | null, expires_at: string }`

## State Management

- `useContract(id)` — TanStack `useQuery`, key `['contract', id]`, includes `key_terms` and `signed_url` in one payload (avoids a waterfall).
- `useSignedUrl(id)` — separate `useQuery` with a `staleTime` just under 1 hour, `refetch()` invoked on a PDF.js load error.
- `targetPage` is local `useState<number | null>` in the results page component, passed down to both `KeyTermsPanel` (to trigger it) and the active viewer (to consume it).

## Component Spec

| Component | Props | Notes |
|---|---|---|
| `PdfViewer` | `signedUrl: string`, `targetPage: number \| null`, `onLoadError: () => void` | `pdfjs-dist`, lazy page rendering, zoom controls |
| `TextViewerFallback` | `contractText: string`, `targetPage: number \| null` | splits on `[PAGE N]` markers, renders each as a labelled `<section id="page-N">`, scrolls to `#page-N` on `targetPage` change — same navigation contract as `PdfViewer` |
| `KeyTermsPanel` | `terms: KeyTerm[]`, `onPageClick: (page: number) => void` | maps `KeyTermRow` |
| `KeyTermRow` | `term: KeyTerm`, `onPageClick` | name, value, page link, `ConfidenceBadge`, `SourceSentenceTooltip` |
| `ConfidenceBadge` | `score: number` | tier dot (green ≥80, amber 50–79, red <50) + `%` + tier word, per design.md — never color-only |
| `SourceSentenceTooltip` | `sentence: string` | expandable "Why?" disclosure |
| `Disclaimer` | none | static "This is an AI-assisted review tool, not legal advice…" banner |

## Design

Per `docs/design.md`: two-panel layout at 16–24px app padding; `ClauseRow`/`KeyTermRow` uses the document-page-card 4px radius; confidence bars fill on load as a progress animation (not decorative); mono font (`JetBrains Mono`) for the confidence % and page citation; collapses to stacked/tabbed under 768px viewport width.

## Acceptance Criteria

- [ ] Opening a completed contract renders the PDF viewer (or text-viewer fallback) and the key terms panel together.
- [ ] Clicking a term's page number scrolls the active viewer to that page.
- [ ] Terms with confidence < 50% show a ⚠️ icon and a non-dismissible tooltip; the term itself is never hidden.
- [ ] Every term's "Why?" control reveals its verbatim `source_sentence`.
- [ ] When `file_path` is null, the text-viewer fallback renders with no error shown to the user.
- [ ] The "Not legal advice" disclaimer is visible on page load without scrolling on desktop.

## Edge Cases

- `signed_url` is `null` (Storage upload failed at upload time) → `TextViewerFallback` renders with no error shown to the user (this is expected, non-blocking behavior, not a failure state).
- Signed URL expired mid-session (results page left open > 1 hour) → `PdfViewer` catches the fetch failure, calls `useSignedUrl`'s refetch, swaps in the new URL without losing `targetPage` or scroll position.
- `key_terms` is empty (extraction returned nothing, or contract still `status = 'processing'`/`'error'`) → panel shows a status-appropriate empty/error state instead of an empty table, with a "Retry processing" action when `status === 'error'` (calls `POST /process` again, per spec 03's idempotency).
- Very long `source_sentence` values → tooltip/disclosure scrolls internally rather than overflowing the layout.
