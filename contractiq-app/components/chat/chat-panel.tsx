'use client'

import { useEffect, useRef } from 'react'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { useChat } from '@/hooks/use-chat'

interface ChatPanelProps {
  contractId: string
  onCitationClick: (page: number) => void
}

export function ChatPanel({ contractId, onCitationClick }: ChatPanelProps) {
  const { messages, sendMessage, isSending, isLoading, error } = useChat(contractId)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="flex h-full flex-col rounded-lg border border-ink-100 bg-paper-white">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-sm text-ink-500">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-500">
            Ask ContractIQ anything about this contract — answers are grounded in the document
            and always cite a page.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onCitationClick={onCitationClick}
              />
            ))}
            {isSending ? <p className="text-xs text-ink-500">ContractIQ is thinking…</p> : null}
            {error ? (
              <p className="text-xs text-red-500">{error} You can try sending it again.</p>
            ) : null}
          </div>
        )}
      </div>
      <ChatInput onSend={sendMessage} disabled={isSending} />
    </div>
  )
}
