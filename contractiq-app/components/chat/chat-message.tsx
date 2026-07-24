import { cn } from '@/lib/utils'
import type { ChatContextSource, ChatMessage as ChatMessageType } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
  onCitationClick: (page: number) => void
}

// STEP 4 of the Conversation Memory Layer — ATTRIBUTE: labels the context
// type the answer was classified into and generated from, so the user can
// see at a glance whether an answer came from the document, the
// conversation itself, or both.
const SOURCE_LABEL: Record<ChatContextSource, string> = {
  contract: 'From document',
  history: 'From conversation',
  both: 'From document + conversation',
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const hasAttribution = !isUser && (message.context_source || message.page_citation)

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-indigo-100 text-ink-900'
            : 'border border-ink-100 bg-paper-white text-ink-900'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {hasAttribution ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {message.context_source ? (
              <span className="inline-flex items-center rounded-pill bg-ink-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-700">
                {SOURCE_LABEL[message.context_source]}
              </span>
            ) : null}
            {message.page_citation ? (
              <button
                type="button"
                onClick={() => onCitationClick(message.page_citation as number)}
                className="inline-flex items-center rounded-pill bg-indigo-500/10 px-2 py-0.5 font-mono text-xs font-medium text-indigo-700 hover:bg-indigo-500/20"
              >
                Source: Page {message.page_citation}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
