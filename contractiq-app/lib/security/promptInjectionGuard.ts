// Detects common prompt-injection attempts in user-authored chat messages
// before they ever reach the LLM. This guards the live, actively-typed chat
// input specifically: a legitimate user has no reason to type these
// phrases, so a match is treated as an attack attempt and the request is
// rejected outright — the message is never saved and OpenAI is never
// called.
//
// Instructions embedded inside the *uploaded contract text* are a
// different threat model and are handled differently: that content can't
// be "rejected" the way a live chat message can (the user didn't type it,
// and legal prose can legitimately contain words like "ignore" or "ai" in
// context — e.g. "the parties agree to ignore any prior drafts"). Instead,
// both lib/openai/extraction.ts and lib/openai/chat.ts's system prompts
// explicitly instruct the model to treat the document as inert data to
// analyze, never as instructions to follow.
//
// Patterns are deliberately anchored to avoid flagging ordinary contract
// language — e.g. "act as (if )?you" rather than a bare "act as", since
// "does this clause act as a waiver of rights?" is a completely normal
// question this assistant must answer, not an attack.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/i,
  /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/i,
  /override\s+your\s+(rules|instructions|guidelines|prompt)/i,
  /reveal\s+(your\s+|the\s+)?system\s+prompt/i,
  /(show|print|output|display)\s+(me\s+)?(your\s+|the\s+)?(system\s+prompt|instructions)\b/i,
  /(expose|reveal|show|print)\s+(the\s+)?(env(ironment)?\s+variables?|api\s+keys?|secrets?)/i,
  /\byou\s+are\s+now\s+a\b/i,
  /\bact\s+as\s+(if\s+)?you\b/i,
  /\bpretend\s+(you('re|\s+are)|to\s+be)\b/i,
  /\bjailbreak\b/i,
  /\bDAN\s+mode\b/i,
  /\bdeveloper\s+mode\b/i,
  /^\s*system\s*:/im, // fake role marker attempting to inject a new "system" turn
]

export interface InjectionCheckResult {
  isSuspicious: boolean
  matchedPattern?: string
}

export function sanitizeForLLM(input: string): InjectionCheckResult {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { isSuspicious: true, matchedPattern: pattern.source }
    }
  }
  return { isSuspicious: false }
}
