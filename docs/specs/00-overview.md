# ContractIQ — Implementation Specification (Index)

**Source:** `docs/engineering/engineering-doc.md` (approved Stage 1 output) + `docs/ContractIQ_PRD.md`
**Scope:** Every MVP feature (PRD P0/P1/P2 user stories), the full database schema, every API route, and the cross-cutting non-functional requirements that apply across features.

This index ties together the granular spec files in this folder so the set can be read as one comprehensive implementation specification. Each linked file is self-contained (a developer can build from it alone) and follows the same structure: Overview → Technical Requirements → User Flow → Database → DB Tasks → API Routes → State Management → Component Spec → Design → Acceptance Criteria → Edge Cases.

---

## 1. Feature specs

| # | Spec | User stories | Covers |
|---|---|---|---|
| 1 | [`01-auth.md`](./01-auth.md) | US-001 | Sign up / sign in / sign out (Supabase Auth) |
| 2 | [`02-contract-upload-and-preprocessing.md`](./02-contract-upload-and-preprocessing.md) | US-002, US-005 | PDF upload, server-side text extraction, custom key term registration |
| 3 | [`03-key-term-extraction.md`](./03-key-term-extraction.md) | US-003, US-004, US-005 (results), US-011-partial | GPT-4o structured extraction, confidence scoring, source sentences |
| 4 | [`04-results-display.md`](./04-results-display.md) | US-003, US-004, US-006, US-011-partial | PDF viewer / text-viewer fallback, key terms panel, page navigation |
| 5 | [`05-inline-key-term-editing.md`](./05-inline-key-term-editing.md) | US-009 | Inline correction of extracted values, original-value retention |
| 6 | [`06-contract-chat.md`](./06-contract-chat.md) | US-007, US-012 | Grounded Q&A, page citations, persistent chat history |
| 7 | [`07-dashboard.md`](./07-dashboard.md) | US-008 | Contract history, summary stats, sortable table |
| 8 | [`08-feedback.md`](./08-feedback.md) | US-010 | Thumbs up/down + comment |
| 9 | [`09-contract-deletion-and-retention.md`](./09-contract-deletion-and-retention.md) | — (compliance) | GDPR delete, 90-day auto-retention |

## 2. Infrastructure specs

| File | Purpose |
|---|---|
| [`supabase-schema.sql`](./supabase-schema.sql) | Single paste-and-run SQL: enums, 6 tables, indexes, triggers, `term_corrections` view, RLS on every table, Storage bucket + policies |
| [`.env.example`](../../.env.example) (repo root, also copied to `contractiq-app/.env.example`) | Every environment variable the app needs, grouped by service, `SERVER ONLY` flagged |

## 3. Cross-cutting technical requirements

These apply across every feature spec above; each spec's own "Technical Requirements" section calls out only what's specific to it. Source: PRD §5 (Constraints).

| Category | Requirement |
|---|---|
| Performance | Upload→results ≤ 30s P95 (≤20-page contracts); chat response ≤ 15s P95; each OpenAI call ≤ 20s P95; inline edit save ≤ 2s; auth flow ≤ 10s |
| Upload limits | ≤ 10 MB, ≤ 20 pages, ≤ 15,000 tokens; text-layer PDFs only; NDA/MSA, English (US/UK law) only; ≤ 5 custom terms |
| Cost | ≤ $0.25 per contract analysis (extraction target ≤ $0.20) |
| Scalability | 100 concurrent analyses without degradation (beta); horizontal scaling to 1,000 concurrent users (post-launch) |
| Reliability | 99.5% uptime target; all OpenAI calls wrapped in 3-attempt exponential-backoff retry; no silent failures — every failure surfaces a human-readable message |
| Security | RLS enabled + policy-scoped on every table (see `supabase-schema.sql`); AES-256 at rest, TLS 1.3 in transit; Storage access only via 1-hour signed URLs; `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` never sent to the client |
| Accessibility | WCAG 2.1 AA across every page — keyboard operability, visible focus states, color never the only signal |
| Compliance | 90-day retention from last access, user-initiated delete at any time, no contract content used to train third-party models, OpenAI called with `user` param and no training opt-in |

## 4. API surface (all routes under `app/api/contracts/**`)

| Method | Path | Spec |
|---|---|---|
| `POST` | `/api/contracts/upload` | 02 |
| `POST` | `/api/contracts/{id}/custom-terms` | 02 |
| `POST` | `/api/contracts/{id}/process` | 03 |
| `GET` | `/api/contracts` | 07 |
| `GET` | `/api/contracts/{id}` | 04 |
| `GET` | `/api/contracts/{id}/signed-url` | 04 |
| `PATCH` | `/api/contracts/{id}/key-terms/{termId}` | 05 |
| `GET` / `POST` | `/api/contracts/{id}/chat` | 06 |
| `POST` | `/api/contracts/{id}/feedback` | 08 |
| `DELETE` | `/api/contracts/{id}` | 09 |
| `POST` | `/api/cron/retention-cleanup` (internal, secret-protected) | 09 |

All endpoints share the error envelope `{ error: { code, message } }` and require a verified Supabase session except the retention cron route, which is secret-protected instead.

## 5. Database (summary — full detail in `supabase-schema.sql` and engineering-doc §7)

`contracts` → `key_terms`, `custom_key_terms`, `chat_sessions` (→ `chat_messages`), `user_feedback` — all FK'd to `contracts.id` with `ON DELETE CASCADE`, all carrying a direct `user_id` for uniform RLS. `term_corrections` is a view over `key_terms WHERE edited = true`. Storage bucket `contracts`, path `contracts/{user_id}/{contract_id}/{filename}.pdf`.

## 6. Build order

Specs are numbered in a sensible build order (auth → upload → extraction → display → editing → chat → dashboard → feedback → retention), matching the Phase 1/2/3 breakdown in engineering-doc §10. This is a suggested sequence, not a hard dependency chain beyond the obvious (e.g. 03 needs 02's uploaded contract to exist; 04 needs 03's extracted terms to display).
