// Centralized token/usage limit constants. Single source of truth — every
// route and validation schema imports from here instead of hardcoding the
// same numbers in multiple places (previously duplicated across
// app/api/contracts/upload/route.ts, app/api/contracts/[contractId]/chat/route.ts,
// and lib/validation/contracts.ts).

// 10 MB — matches the Storage bucket's file_size_limit set in database.sql.
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

// PRD §5 caps contracts at 20 pages to bound OpenAI cost per analysis
// (target <= $0.20/analysis) — a deliberate product/cost constraint, not a
// generic default. Do not raise this without revisiting the cost budget.
export const MAX_PAGE_COUNT = 20

// PRD §5 contract-length cap — rejected before any OpenAI call is made.
export const MAX_ESTIMATED_TOKENS = 15000

// Below this extracted word count, a PDF is treated as scanned/image-only
// and rejected with a graceful error rather than sent to the AI pipeline.
export const MIN_WORD_COUNT = 100

export const MAX_CHAT_MESSAGE_LENGTH = 2000
export const MAX_CUSTOM_TERM_LENGTH = 80
export const MAX_CUSTOM_TERMS_PER_CONTRACT = 5
export const MAX_FEEDBACK_COMMENT_LENGTH = 1000

// How many prior chat_messages rows are ever loaded as conversation
// context, per docs/engineering/engineering-doc.md §8. Configurable via env
// so a deployment can tune it without a code change; defaults to the value
// already documented there.
export const MAX_CHAT_HISTORY = Number(process.env.MAX_CHAT_HISTORY) || 200
