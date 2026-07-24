# Spec: Feedback Submission (US-010)

Source: `docs/engineering/engineering-doc.md` §4.6, §9, §7.

## Overview

A lightweight thumbs up/down + optional comment on the results page, feeding the product's quality-monitoring loop.

## Technical Requirements

- Comment length capped at 1,000 characters, enforced both client-side and by the DB `check` constraint.
- No AI involvement — plain authenticated write, RLS-scoped, no special performance target beyond normal request latency.

## User Flow

1. On `/contracts/{id}`, user clicks a thumbs-up or thumbs-down icon.
2. Rating submits immediately on click (no separate "submit" step for the rating itself).
3. An optional comment field appears after rating, submittable independently (comment can be added, edited, or skipped).
4. A toast confirms "Thanks for the feedback."

## Database

Writes `user_feedback`. No new tables.

## DB Tasks

None beyond the base schema.

## API Routes

### `POST /api/contracts/{id}/feedback`

- **Auth:** required, must own contract
- **Request:** `{ rating: 'up' | 'down', comment?: string }` (comment ≤ 1000 chars, matches the DB `check` constraint)
- **Server steps:** `INSERT INTO user_feedback (contract_id, user_id, rating, comment)`. Multiple feedback rows per contract are allowed at MVP (e.g. a user changes their mind) — no uniqueness constraint; the UI always shows the most recent submission.
- **Response `201`:** `{ feedback: { id, rating, comment, created_at } }`

## State Management

`useSubmitFeedback(contractId)` — TanStack `useMutation`; local component state tracks the currently-selected rating for immediate visual feedback before the network call resolves.

## Component Spec

| Component | Props | Notes |
|---|---|---|
| `FeedbackWidget` | `contractId: string` | thumbs up/down icon buttons + optional comment textarea, shown at the bottom of the results page |

## Design

Icon buttons from Lucide (`ThumbsUp`/`ThumbsDown`); selected state uses `--brand`; comment field is a standard `Input`/textarea per design.md, revealed with the 120ms ease-out hover/reveal timing used elsewhere in the system.

## Acceptance Criteria

- [ ] Clicking thumbs up or thumbs down immediately submits a `user_feedback` row and shows a confirmation toast.
- [ ] The optional comment can be submitted independently of the rating, after a rating exists.
- [ ] The feedback widget is hidden for contracts not yet `status = 'completed'`.
- [ ] A comment over 1,000 characters is rejected with a clear error before submission.

## Edge Cases

- Comment submitted without a rating → client blocks this (rating is required first; comment field only renders after a rating is chosen).
- Feedback on a contract still `status = 'processing'` or `'error'` → widget is hidden until `status === 'completed'` (no meaningful feedback to give on an incomplete review).
