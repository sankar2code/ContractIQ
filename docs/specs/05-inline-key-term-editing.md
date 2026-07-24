# Spec: Inline Key Term Editing (US-009)

Source: `docs/engineering/engineering-doc.md` §4.4, §9, §7.

## Overview

Lets a user correct an extracted term's value directly in the key terms panel. The original AI value is preserved for the feedback/improvement loop (`term_corrections` view).

## Technical Requirements

- Save must be reflected in the UI within 2 seconds (PRD §5) — satisfied via the optimistic update, independent of network round-trip time.
- `original_ai_value` must be set exactly once, on the first edit only — never overwritten by subsequent edits.
- Edits are authorized the same way as reads: RLS + explicit contract-ownership check, no service-role bypass.

## User Flow

1. User clicks a term's value in `KeyTermRow` (results page, spec 04).
2. Value becomes an editable text input, pre-filled with the current value.
3. On blur or Enter, an optimistic update renders immediately; a `PATCH` request fires in the background.
4. On success, the row shows an "Edited" badge next to the term name.
5. On failure, the value reverts to the previous state and a toast shows "Couldn't save your edit — try again."

## Database

Writes `key_terms.value`, `key_terms.edited`, `key_terms.original_ai_value`. No new tables.

## DB Tasks

None beyond the base schema. Note the `original_ai_value` write logic: only set on the **first** edit (`COALESCE(original_ai_value, <value before this update>)`) so a second edit doesn't overwrite the true original AI output.

## API Routes

### `PATCH /api/contracts/{id}/key-terms/{termId}`

- **Auth:** required, must own contract (and the term must belong to that contract)
- **Request:** `{ value: string }` (1–2000 chars, trimmed; rejects empty string)
- **Server steps:**
  1. Fetch the current row.
  2. `UPDATE key_terms SET value = $new, edited = true, original_ai_value = COALESCE(original_ai_value, $current_value), updated_at = now() WHERE id = $termId AND contract_id = $id`.
- **Response `200`:** `{ key_term: KeyTerm }`
- **Errors:** `400` empty/too-long value, `404` term or contract not found/not owned
- **Performance:** must complete and be reflected in the UI within 2 seconds (PRD constraint) — the optimistic update satisfies the perceived-latency requirement even if the network round trip is slower.

## State Management

`useUpdateKeyTerm(contractId)` — TanStack `useMutation` with `onMutate` optimistic cache update against `['key-terms', contractId]` / the embedded `key_terms` array in `['contract', contractId]`, and `onError` rollback to the previous cache snapshot.

## Component Spec

| Component | Props | Notes |
|---|---|---|
| `KeyTermRow` (extended from spec 04) | adds `onEdit: (termId, value) => void`, `isEditing: boolean` | click-to-edit value cell |
| `EditedBadge` | none | small pill, shown when `term.edited === true` |

## Design

Editable state uses a focus ring in `--brand`; "Edited" badge uses neutral-100 background per design.md's Badge component (not a confidence color — editing status is orthogonal to confidence).

## Acceptance Criteria

- [ ] Editing a term's value and submitting updates the displayed value immediately (optimistic) and persists it server-side.
- [ ] The row shows an "Edited" badge after a successful save.
- [ ] `original_ai_value` retains the true original AI output even after multiple subsequent edits.
- [ ] A failed save reverts the displayed value and shows a retry-oriented error toast.
- [ ] Submitting an empty value is blocked client-side; no request is sent.
- [ ] The `term_corrections` view reflects the edit immediately after a successful save.

## Edge Cases

- Editing a term that's currently mid-optimistic-update from a different tab (rare, Realtime not used for key_terms) → last write wins; not specifically reconciled at MVP.
- User clears the value entirely and blurs → client-side validation blocks the empty submit and reverts to the last known value rather than sending an invalid request.
- Editing a custom term (`is_custom = true`) works identically to a standard term — no special-casing.
