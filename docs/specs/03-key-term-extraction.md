# Spec: AI Key Term Extraction (US-003, US-004, US-005 results, US-011-partial)

Source: `docs/engineering/engineering-doc.md` §8, §9, §7.

## Overview

Runs GPT-4o against a contract's stored text to produce the structured key-term list (standard terms for the contract type + any registered custom terms), with page number, confidence score, and source sentence per term.

## Technical Requirements

- Model: GPT-4o, JSON mode, `temperature: 0.1`, `max_tokens: 2000` (engineering-doc §8).
- Cost target: ≤ $0.20 per 20-page extraction (PRD §5/§6).
- Latency: each OpenAI call ≤ 20s P95; combined with upload, time-to-first-key-term-display ≤ 30s P95 (PRD §5).
- Reliability: 3-attempt exponential-backoff retry on transient OpenAI failures, plus one dedicated retry on invalid JSON (PRD External Dependencies mitigation).
- Must support 100 concurrent analyses without degradation (PRD §5 Scalability constraints).
- Every persisted term must carry a non-empty `source_sentence` (hallucination guardrail, engineering-doc §8).

## User Flow

Continues directly from `docs/specs/02-contract-upload-and-preprocessing.md` step 5 — this is the "analysing with AI" progress step, triggered automatically by the frontend immediately after upload (+ custom-term registration) succeeds. No separate user action.

## Database

Reads `contracts.contract_text`, `contracts.contract_type`, `custom_key_terms`. Writes `key_terms` rows and updates `contracts.status`.

## DB Tasks

None beyond the base schema.

## API Routes

### `POST /api/contracts/{id}/process`

- **Auth:** required, must own contract
- **Request:** `{}` (empty body)
- **Preconditions:** `contract.status IN ('uploaded', 'error')` else `409 { code: 'ALREADY_PROCESSING' }` (idempotency guard so a duplicate click doesn't double-run extraction)
- **Server steps:**
  1. `UPDATE contracts SET status = 'processing'`.
  2. Load `custom_key_terms` for the contract; build the term target list = standard terms for `contract_type` (from `lib/openai/prompts/{nda,msa}-extraction.ts`) + custom term names.
  3. Call `lib/openai/extraction.ts#extractTerms(contractText, termTargets, contractType)`:
     - System prompt includes 3 few-shot NDA or MSA examples (matching `contract_type`) with the exact JSON schema below.
     - `response_format: { type: 'json_object' }`, `temperature: 0.1`, `max_tokens: 2000`.
     - Wrapped in `lib/openai/with-retry.ts` (3 attempts, exponential backoff on 5xx/timeout).
  4. Parse response with `lib/validation/extraction-response.ts` (Zod). On parse failure: send the single documented recovery prompt ("Your previous response was not valid JSON. Return only the JSON array, no explanation.") once; if it fails again, treat as upstream failure.
  5. Drop any term whose `source_sentence` is empty/missing (treated as unreliable per engineering-doc §8) before persisting.
  6. `INSERT INTO key_terms (contract_id, user_id, term_name, value, page_number, confidence_score, source_sentence, is_custom)` — one row per surviving term, `is_custom = true` for terms that came from `custom_key_terms`.
  7. On any unrecoverable failure: `UPDATE contracts SET status = 'error'`, return `502`.
  8. On success: `UPDATE contracts SET status = 'completed'`.
- **Response `200`:** `{ status: 'completed', key_terms: KeyTerm[] }`
- **Errors:** `409` already processing, `502 { code: 'UPSTREAM_ERROR' }` OpenAI failure after retries

### Extraction JSON schema (OpenAI response contract)

```json
[
  {
    "term_name": "string",
    "value": "string",
    "page_number": 1,
    "confidence_score": 0.0,
    "source_sentence": "string"
  }
]
```
`confidence_score` is returned by the model as 0.0–1.0 and multiplied by 100 before storage (DB column is 0–100, per engineering-doc §7).

### Standard term lists

- **NDA (10):** Parties, Effective Date, Confidentiality Obligations, Permitted Disclosures, Term & Duration, Governing Law, Jurisdiction, IP Ownership, Non-Solicitation, Breach & Remedy.
- **MSA (12):** Parties, Service Scope, Payment Terms, Invoice Schedule, Late Payment Penalty, Liability Cap, Indemnification, IP Ownership, Termination Clause, Governing Law, Dispute Resolution, Notice Period.

These live as exported `const` arrays in `lib/openai/prompts/nda-extraction.ts` and `msa-extraction.ts`, imported both by the Route Handler (to build the prompt) and by `KeyTermPreviewList` (spec 02, client-side, for the pre-processing preview) — single source of truth, no duplication.

## State Management

`useProcessContract(contractId)` — TanStack `useMutation`; on success, invalidates the `['contract', contractId]` and `['key-terms', contractId]` query keys so the results page (spec 04) refetches.

## Component Spec

No new UI components — this is a backend-only spec. The 3-step `UploadProgress` component (spec 02) reflects this call's in-flight state.

## Design

N/A (no UI surface of its own).

## Acceptance Criteria

- [ ] Processing an uploaded NDA/MSA produces `key_terms` rows for ≥ 80% of the standard terms for that contract type, each with `value`, `page_number`, `confidence_score`, and `source_sentence`.
- [ ] Registered custom terms are extracted with the identical structure and `is_custom = true`.
- [ ] `contracts.status` transitions `uploaded → processing → completed` on success, or `→ error` on unrecoverable OpenAI failure.
- [ ] A term with no supporting sentence is never persisted.
- [ ] A duplicate `POST /process` call while already processing returns `409` and does not create duplicate `key_terms` rows.
- [ ] End-to-end time from upload submission to key terms rendered is ≤ 30s P95 for a 20-page contract.

## Edge Cases

- OpenAI returns fewer terms than requested (model skips one) → accepted as-is; missing standard terms simply don't appear in `key_terms` (UI shows only what was returned — PRD does not require placeholder rows for missing terms).
- OpenAI hallucinates a `page_number` outside `1..page_count` → clamp to `page_count` server-side before insert rather than rejecting the whole term (avoids losing an otherwise-useful extraction over one bad field).
- Retry-on-invalid-JSON must not double the token spend materially — the retry re-sends the same system prompt + a short corrective user message, not the full few-shot examples twice, to stay within the $0.20 extraction cost target.
- Concurrent duplicate `POST /process` calls for the same contract (e.g. double-click) → the `status` precondition check (step 3 of "Server steps") makes the second call return `409` rather than running extraction twice.
