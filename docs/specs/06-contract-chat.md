# Spec: Contract Chat / Q&A (US-007, US-012)

Source: `docs/engineering/engineering-doc.md` §4.5, §8, §9, §7.

## Overview

A chat interface grounded strictly in the uploaded contract's text and/or the conversation itself, with mandatory source citations, persisted history, and hallucination-refusal fallbacks. A **Conversation Memory Layer** classifies every question into one of three context types (`contract` / `history` / `both`) before generating a response, so the assistant only falls back to "answer only from the document" when the question is actually about the document — a `history` question is answered from the conversation instead of being forced through document-only grounding.

## Technical Requirements

- Chat response latency ≤ 15s P95; each OpenAI call ≤ 20s P95 (PRD §5).
- Model: GPT-4o, `temperature: 0.4`, `max_tokens: 1000`, full contract context (≤ 15,000 tokens, no chunking), up to 200 messages of history (engineering-doc §8).
- Every substantive response must include a `[Page X]` citation; hallucination rate target ≤ 5% (offline eval, PRD §10).
- 3-attempt exponential-backoff retry on transient OpenAI failures (PRD External Dependencies mitigation).

## User Flow

1. User opens the "Chat with Contract" tab/floating panel on `/contracts/{id}`.
2. On first open, frontend calls `GET /api/contracts/{id}/chat` to load any existing history (empty array if no session yet).
3. User types a question, submits.
4. Message is optimistically appended (right-aligned); input disabled while awaiting response.
5. `POST /api/contracts/{id}/chat` returns the assistant's answer; it's appended left-aligned, prefixed "Based on the document…", with a clickable `Source: Page X` citation chip.
6. Clicking the citation sets `targetPage` on the results page (same mechanism as spec 04's key-term page links), scrolling the PDF/text viewer.
7. Reopening the contract later reloads the full prior conversation via step 2.

## Database

Reads `contracts.contract_text`, `chat_sessions`, `chat_messages`. Writes `chat_sessions` (lazily, first message only) and `chat_messages` (one row per turn, both user and assistant). Assistant rows also set `context_source` (`contract` / `history` / `both`) to the Conversation Memory Layer's classification for that turn — `null` on user rows.

## DB Tasks

None beyond the base schema. `chat_sessions.contract_id` is `unique`, so "create if not exists" is an `insert ... on conflict (contract_id) do nothing` followed by a `select`, not a race-prone check-then-insert.

## API Routes

### `GET /api/contracts/{id}/chat`

- **Auth:** required, must own contract
- **Response `200`:** `{ messages: ChatMessage[] }` — ascending `created_at`, up to 200 messages, empty array if no session exists yet.

### `POST /api/contracts/{id}/chat`

- **Auth:** required, must own contract
- **Request:** `{ message: string }` (1–2000 chars)
- **Server steps — the Conversation Memory Layer (`lib/openai/chat.ts`):**
  1. Get-or-create the `chat_sessions` row for this contract.
  2. **Load `priorHistory`** — all prior messages for the session, ascending, capped at 200 — **before** the new message is saved. This order is load-bearing: classification runs against `priorHistory` plus the new message text, kept as two separate values. Saving the new message first and fetching "history" afterward would put the new message inside its own history, corrupting classification on every turn (it would always look partially self-referential).
  3. `INSERT` the user's message into `chat_messages` (`role = 'user'`) — now that `priorHistory` has already been captured.
  4. **CLASSIFY** the new message into `contract` / `history` / `both` — a cheap keyword heuristic (`classifyQuery`), no extra API call. `history`-referential phrasing ("you said", "what did I ask", "summarize our conversation", …) → `history`, unless the message also contains contract-domain vocabulary ("page", "clause", "liability", "termination", …) → `both`. Neither → `contract` (the default).
  5. **RETRIEVE** the context for that classification: `contract` and `both` take `contract_text` + the last 10 messages of `priorHistory`; `history` takes **no** `contract_text`, just the last 20 messages of `priorHistory`.
  6. **RESPOND** — build the matching system prompt and call GPT-4o (`temperature: 0.4`, `max_tokens: 1000`) via `lib/openai/with-retry.ts`:
     - `contract` → "Answer only from the contract document… If the answer is not in the document, say 'I cannot find this in the document.' … cite `[Page X]`."
     - `history` → "Answer only from the conversation history… do not use the contract document… If not present, say 'I cannot find this in our conversation.' End every response with `[From conversation]`."
     - `both` → "Answer using both… attribute every fact: `[Page X]` for document facts, `[From conversation]` for conversation facts."
  7. Parse the response for a `[Page X]` pattern → `page_citation` (int or null).
  8. If the required tag for that classification (`[Page X]` for `contract`, `[From conversation]` for `history`, either for `both`) is missing and the response isn't a "not found" fallback, retry once with a corrective instruction; otherwise accept as-is.
  9. **ATTRIBUTE** — `INSERT` the assistant's message into `chat_messages` (`role = 'assistant'`, `content`, `page_citation`, `context_source` = the classification from step 4).
- **Response `200`:** `{ message: ChatMessage }` (the assistant turn only — the user turn was already optimistically rendered client-side)
- **Errors:** `400` empty/too-long message, `502` OpenAI failure after retries
- **Latency target:** ≤ 15s P95 (PRD constraint).

## State Management

- `useChatHistory(contractId)` — `useQuery`, key `['chat', contractId]`.
- `useSendMessage(contractId)` — `useMutation`, optimistically appends the user message to the `['chat', contractId]` cache in `onMutate`, appends the assistant reply on success.
- Optional: a Supabase Realtime channel subscribed to `chat_messages` filtered by `session_id`, so a second open tab for the same contract sees new messages live (nice-to-have per engineering-doc §5, not required for the core flow to work since the mutation already updates the local cache).

## Component Spec

| Component | Props | Notes |
|---|---|---|
| `ChatPanel` | `contractId: string` | tab or floating panel container |
| `ChatMessage` | `message: ChatMessage` | left/right alignment by `role`; renders a `context_source` badge ("From document" / "From conversation" / "From document + conversation") plus a citation chip if `page_citation` present |
| `ChatInput` | `onSend: (text) => void`, `disabled: boolean` | disabled while a response is in flight |

## Design

Per `docs/design.md`'s `ChatMessage` component: user bubbles right-aligned on `--brand`-tinted background, assistant bubbles left-aligned on `--bg-surface`; citation chips use the pill radius + mono font for "Page X"; 280ms panel entry animation, no bounce.

## Acceptance Criteria

- [ ] Asking a question answerable from the document returns a grounded response with a `[Page X]` citation within 15s P95.
- [ ] Asking about something absent from the document returns "I cannot find this in the document" rather than a fabricated answer.
- [ ] Reopening a contract's results page reloads its full prior chat history in order.
- [ ] Clicking a citation scrolls the PDF/text viewer to the cited page.
- [ ] A memory-style follow-up question ("what did you say earlier about X?") is classified `history`, answered from `priorHistory` only (no contract text sent), and tagged `[From conversation]`.
- [ ] A question mixing a prior answer with a new document lookup ("you said X — does the contract confirm that?") is classified `both` and attributes each fact to `[Page X]` or `[From conversation]` as appropriate.
- [ ] Every assistant message's `context_source` matches the badge shown in the UI.
- [ ] An OpenAI failure after retries leaves the user's message visible with a retry affordance — no message is silently dropped.

## Edge Cases

- Question about something absent from the document → model responds "I cannot find this in the document" — this is logged and rendered as a normal (not error) response.
- Question about something absent from the conversation (`history` classification, no matching prior turn) → model responds "I cannot find this in our conversation" rather than fabricating a memory.
- `history` classification on the very first message of a session (empty `priorHistory`) → the model correctly reports it cannot find the answer in an empty conversation; no crash on an empty context array.
- Conversation exceeds 200 messages → oldest messages beyond the 200 cap are excluded from `priorHistory` entirely (not just from the per-turn 10/20 slice) but remain in the DB and in the UI's scrollback (PRD's memory guarantee is scoped to "up to 200 messages").
- OpenAI failure after retries → user's message stays visible in the thread with a small inline "Failed to get a response — try again" affordance that re-fires the same mutation; no message is silently lost.
