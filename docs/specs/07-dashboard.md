# Spec: Dashboard & Contract History (US-008)

Source: `docs/engineering/engineering-doc.md` §4.2, §9, §7.

## Overview

The authenticated landing page after sign-in: a summary of the user's contract activity and a sortable list of every contract they've reviewed.

## Technical Requirements

- List/aggregate queries must use the `idx_contracts_user_created` / `idx_contracts_user_status` indexes — no full table scans as contract volume grows toward the 100-concurrent-user scalability target (PRD §5).
- RLS-scoped: a user only ever sees their own `contracts` rows.

## User Flow

1. User signs in → redirected to `/dashboard`.
2. First-time users see the empty state: "No contracts reviewed yet — upload your first contract to begin," with a prominent "Review a Contract" CTA.
3. Returning users see: total contracts processed, a breakdown by type (NDA vs MSA), and the last 5 contracts with status + date in a summary card, plus a full sortable table below.
4. User can sort the table by date, name, or type (asc/desc); clicking any row opens `/contracts/{id}`.
5. "Review a Contract" CTA is present in both states, linking to `/contracts/upload`.

## Database

Read-only: aggregate and list queries against `contracts`.

## DB Tasks

None beyond the base schema's `idx_contracts_user_created` and `idx_contracts_user_status` indexes, which already support this feature's access patterns.

## API Routes

### `GET /api/contracts`

- **Auth:** required
- **Query params:** `sort ∈ {date, name, type}` (default `date`), `order ∈ {asc, desc}` (default `desc`)
- **Server steps:** `SELECT id, contract_type, file_name, status, created_at FROM contracts WHERE user_id = auth.uid() ORDER BY <sort column> <order>`; separately compute `COUNT(*) FILTER (WHERE contract_type = 'nda')` and `'msa'` for the summary.
- **Response `200`:** `{ contracts: ContractSummary[], total: number, by_type: { nda: number, msa: number } }`

`ContractSummary = { id, contract_type, file_name, status, created_at }`.

## State Management

`useContracts({ sort, order })` — TanStack `useQuery`, key `['contracts', sort, order]`; sort/order held in the URL query string (`?sort=date&order=desc`) so it's shareable/bookmarkable and survives refresh.

## Component Spec

| Component | Props | Notes |
|---|---|---|
| `SummaryCards` | `total: number`, `byType: { nda, msa }`, `recent: ContractSummary[]` | top-of-page stat row |
| `ContractsTable` | `contracts: ContractSummary[]`, `sort`, `order`, `onSortChange` | sortable columns, row click → navigate |
| `EmptyDashboardState` | none | shown when `total === 0` |

## Design

Stat cards use `Card` component per design.md (10px radius, soft shadow); status shown as a small `Badge` (`processing` = amber tone, `completed` = neutral, `error` = red — reusing the confidence color semantics for consistency, not introducing a new color meaning).

## Acceptance Criteria

- [ ] A first-time user sees the empty state with a "Review a Contract" CTA.
- [ ] A returning user sees total contracts, NDA/MSA breakdown, and the last 5 contracts.
- [ ] The full contract table is sortable by date, name, and type, ascending and descending.
- [ ] Clicking any row opens that contract's results page.
- [ ] Sort/order selections persist across a page refresh (via URL query params).

## Edge Cases

- Contract stuck in `status = 'processing'` (e.g. server crashed mid-call) beyond a reasonable window → row still shows "Processing" with no special handling at MVP; opening it lets the user retry via the "Retry processing" action defined in spec 04.
- Very long `file_name` values → truncate with ellipsis in the table, full name on hover/tooltip.
