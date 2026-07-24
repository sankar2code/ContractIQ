# Spec: Contract Deletion & 90-Day Retention

Source: `docs/engineering/engineering-doc.md` §7 (Storage retention), §10 (Phase 3), PRD "Usability & compliance constraints."

## Overview

Two related mechanisms: (1) user-initiated deletion of a contract and all its data at any time (GDPR right-to-delete), and (2) an automatic 90-day-post-last-access retention cleanup.

## Technical Requirements

- 90-day retention window measured from `last_accessed_at`, per PRD §5 Usability & compliance constraints.
- User-initiated delete must satisfy GDPR right-to-erasure — full cascade across `key_terms`, `custom_key_terms`, `chat_sessions`/`chat_messages`, `user_feedback`, and the Storage object.
- The retention cron endpoint must not be reachable by any authenticated user session — shared-secret protected only.

## User Flow

### User-initiated delete
1. User clicks "Delete" on a contract (dashboard row menu or the results page).
2. A confirmation modal warns this removes the contract, its extracted terms, chat history, and feedback permanently.
3. On confirm, `DELETE /api/contracts/{id}` fires; on success, the user is redirected to `/dashboard` (if deleted from the results page) or the row disappears from the table (if deleted from the dashboard).

### Automatic retention
Not user-facing — a scheduled job runs daily, deleting contracts (and their Storage objects) whose `last_accessed_at` is older than 90 days. `last_accessed_at` is bumped to `now()` every time `GET /api/contracts/{id}` is called (i.e., every time the user opens the results page), so only genuinely stale, unrevisited contracts are swept.

## Database

Deletes cascade automatically via `ON DELETE CASCADE` foreign keys already defined in `supabase-schema.sql` (`key_terms`, `custom_key_terms`, `chat_sessions` → `chat_messages`, `user_feedback` all reference `contracts.id` with cascade). No additional schema changes needed.

## DB Tasks

- Add a `last_accessed_at` bump on every `GET /api/contracts/{id}` call: `UPDATE contracts SET last_accessed_at = now() WHERE id = $id` (fire-and-forget, does not block the response).
- The retention sweep itself is not a DB migration — it's a scheduled job (see below).

## API Routes

### `DELETE /api/contracts/{id}`

- **Auth:** required, must own contract
- **Server steps:**
  1. If `file_path is not null`, delete the Storage object via the service-role client.
  2. `DELETE FROM contracts WHERE id = $id AND user_id = auth.uid()` — cascades to all child rows.
- **Response:** `204 No Content`
- **Errors:** `404` not found/not owned

### Retention job (not a user-facing endpoint)

- Implemented as `app/api/cron/retention-cleanup/route.ts`, a `POST` handler invoked by Vercel Cron (daily) or Supabase's `pg_cron`, protected by a shared secret header (`CRON_SECRET` env var, checked before running — not exposed to the frontend, not reachable by any authenticated user session) so it cannot be triggered by an ordinary user.
- **Server steps:** `SELECT id, file_path FROM contracts WHERE last_accessed_at < now() - interval '90 days'`; for each, delete the Storage object (if present) then the row (cascades). Runs in batches (e.g. 100 at a time) to avoid a single long-running request.

## State Management

`useDeleteContract()` — TanStack `useMutation`, invalidates `['contracts']` on success. No client state needed for the retention job (server-only).

## Component Spec

| Component | Props | Notes |
|---|---|---|
| `DeleteContractDialog` | `contractId: string`, `contractName: string`, `onConfirm`, `onCancel` | shadcn `Dialog`, destructive-styled confirm button |

## Design

Confirm button uses `--confidence-low` red per design.md's convention for destructive actions (only non-confidence use of that color, reserved specifically for irreversible-delete confirmations).

## Acceptance Criteria

- [ ] Deleting a contract removes it and all associated key terms, custom terms, chat sessions/messages, and feedback — verified by querying each table post-delete.
- [ ] Deleting a contract also removes its Storage object when `file_path` is present.
- [ ] A contract untouched for 90+ days is removed by the daily retention job without user action.
- [ ] Opening a contract bumps `last_accessed_at`, resetting its retention clock.
- [ ] The retention cron endpoint rejects requests without the correct shared secret.
- [ ] A user who has a just-deleted contract open in another tab sees a graceful "no longer available" state on their next action, not a raw error.

## Edge Cases

- Deleting a contract mid-chat or mid-processing → allowed; cascading deletes handle any in-progress `status = 'processing'` row the same as a completed one. Any in-flight `POST /process` call for that contract will fail its subsequent `UPDATE` (row no longer exists) — caught and swallowed, not surfaced as an error to a user who explicitly just deleted the contract.
- Retention job deleting a contract while the owner has it open in another tab → next API call against that contract returns `404`; frontend shows "This contract is no longer available" and redirects to `/dashboard`.
- Storage delete fails (network blip) during either flow → DB delete still proceeds (per the non-blocking Storage principle used throughout); an orphaned Storage object is an acceptable, low-severity outcome versus blocking the user's deletion request, and is caught by the daily retention sweep's own cleanup pass regardless.
