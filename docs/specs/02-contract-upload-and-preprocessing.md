# Spec: Contract Upload, Text Extraction & Custom Term Pre-Processing (US-002, US-005)

Source: `docs/engineering/engineering-doc.md` §4.3, §8, §9, §7.

## Overview

Covers everything from "user picks a contract type and a PDF" through "text is extracted and stored, custom terms are registered" — up to (but not including) the AI extraction call itself, which is `docs/specs/03-key-term-extraction.md`.

## Technical Requirements

- File size ≤ 10 MB, page count ≤ 20, estimated tokens ≤ 15,000 — all enforced **server-side**, not just client-side (PRD §5 Upload & document constraints).
- Only `application/pdf` accepted; only text-layer PDFs (< 100 extracted words ⇒ rejected as scanned).
- Max 5 custom key terms per contract (PRD §5).
- Storage upload is non-blocking — a Storage failure must never block or fail the upload request itself (engineering-doc §7).
- PDF stored encrypted at rest (Supabase Storage AES-256) with TLS 1.3 in transit; object path restricted to `contracts/{user_id}/{contract_id}/{filename}.pdf` per the Storage RLS policies in `supabase-schema.sql`.
- Text extraction is part of the overall ≤ 30s P95 upload→results budget (PRD §5) and should be near-instant relative to the AI call in spec 03.

## User Flow

1. User on `/contracts/upload` selects contract type (`nda` | `msa`) from a `Select`.
2. User drags/drops or file-picks a PDF. Client validates `type === 'application/pdf'` and `size <= 10MB` before allowing submit; shows the error inline if not.
3. A static preview card renders the standard term list for the selected type (no API call — hardcoded from `lib/openai/prompts/nda-extraction.ts` / `msa-extraction.ts` term lists, imported client-side as plain constants).
4. User optionally clicks "+ Add Key Term" up to 5 times, typing a custom term name (≤ 80 chars) each time; each appears in the preview list with a "Custom" badge and a remove (×) control.
5. User clicks "Process Contract". Frontend first `POST`s the file to `/api/contracts/upload`, then (if any custom terms were added) `POST`s them to `/api/contracts/{id}/custom-terms`, then calls `/api/contracts/{id}/process` (spec 03).
6. A 3-step progress indicator (extracting text → analysing with AI → compiling results) reflects these three sequential calls.
7. On success, redirect to `/contracts/{id}`.

## Database

Writes to `contracts` and `custom_key_terms` (see `supabase-schema.sql`). No new tables beyond what's already defined.

## DB Tasks

None beyond the base schema — this feature only performs standard INSERTs, no new migrations.

## API Routes

### `POST /api/contracts/upload`

- **Auth:** required (`requireUser`, 401 if absent)
- **Request:** `multipart/form-data`: `file` (PDF blob), `contract_type` (`'nda' | 'msa'`)
- **Server steps:**
  1. Reject if `file.type !== 'application/pdf'` → `400 { error: { code: 'VALIDATION_ERROR', message: 'Only PDF files are supported.' } }`
  2. Reject if `file.size > 10 * 1024 * 1024` → `400`, message "File exceeds the 10 MB limit."
  3. Run `lib/pdf/extract-text.ts` (`pdf-parse`) → `{ text, pageCount }`. Insert `[PAGE N]` before each page's text based on `pdf-parse`'s per-page render callback.
  4. Reject if `pageCount > 20` → `422`, "Contracts over 20 pages are not supported yet."
  5. Reject if `text.split(/\s+/).length < 100` → `422 { code: 'SCANNED_PDF' }`, "Scanned PDFs are not supported yet."
  6. Estimate tokens (`text.length / 4` heuristic is sufficient — no tokenizer dependency needed) → reject if > 15,000 → `422`, "This contract is too long for MVP (15,000 token limit)."
  7. Upload the raw PDF to Supabase Storage at `contracts/{user_id}/{contract_id}/{file_name}` using the **service-role** client (`lib/supabase/admin.ts`) — wrapped in try/catch; on failure, log and continue with `file_path = null` (non-blocking per engineering-doc §7).
  8. `INSERT INTO contracts (user_id, contract_type, file_name, file_path, contract_text, page_count, status) VALUES (..., 'uploaded')`.
- **Response `201`:** `{ contract_id: string, page_count: number, status: 'uploaded' }`

### `POST /api/contracts/{id}/custom-terms`

- **Auth:** required, must own contract (RLS + explicit `contract.user_id === user.id` check before insert, since this uses no service-role bypass)
- **Request:** `{ terms: string[] }`
- **Server steps:** reject if `terms.length > 5` → `400`; reject on duplicate names within the payload or against existing rows → `400`; insert one row per term into `custom_key_terms`.
- **Response `200`:** `{ custom_terms: { id: string, term_name: string }[] }`

## State Management

- `useUploadContract()` — TanStack `useMutation` wrapping the 3-call sequence above, exposing `{ step: 'idle'|'uploading'|'extracting-ai'|'done'|'error', error }` for the progress indicator.
- Custom-term drafts are local `useState<string[]>` in `UploadForm` until submit — not persisted until the mutation fires.

## Component Spec

| Component | Props | Notes |
|---|---|---|
| `UploadForm` | none | contract-type select, dropzone, submit button |
| `KeyTermPreviewList` | `contractType: 'nda'\|'msa'`, `customTerms: string[]` | renders standard + custom term names, read-only labels |
| `CustomTermInput` | `value: string[]`, `onChange: (v: string[]) => void`, `max: 5` | text input + "+ Add" button, disabled past 5 |
| `UploadProgress` | `step: UploadStep` | 3-step indicator |

## Design

Dropzone uses `--border-default` dashed border, `--brand` on drag-over; "Custom" badge uses the pill radius (999px) per design.md; progress steps use the indigo brand color for the active step, neutral-300 for pending, green for completed.

## Acceptance Criteria

- [ ] Uploading a valid ≤ 10 MB / ≤ 20-page NDA or MSA PDF creates a `contracts` row with `status = 'uploaded'` and full `contract_text` (with `[PAGE N]` markers).
- [ ] Uploading a file > 10 MB is rejected with a clear inline error before any server processing.
- [ ] Uploading a > 20-page PDF is rejected with a clear error; no `contracts` row is created.
- [ ] Uploading a scanned/image PDF (< 100 extracted words) is rejected with "Scanned PDFs are not supported yet."
- [ ] User can add up to 5 custom terms; a 6th is blocked client-side.
- [ ] Custom terms appear in the pre-processing preview with a "Custom" badge before processing starts.
- [ ] If Storage upload fails, the contract is still created with `file_path = null` and the flow continues uninterrupted.

## Edge Cases

- Corrupted/unparseable PDF → `pdf-parse` throws → caught, `500 { code: 'INTERNAL_ERROR' }`, "That file didn't parse. Try a text-based PDF (not a scanned image)." No partial `contracts` row is written (insert happens only after successful extraction).
- User navigates away mid-upload → mutation is aborted client-side; no orphaned `contracts` row exists since the row is only created after extraction succeeds server-side within the same request.
- Non-NDA/MSA content uploaded under either type → not rejected (soft warning only, per PRD's "graceful degradation" internal risk mitigation) — extraction still runs in spec 03, low confidence scores naturally flag the mismatch.
