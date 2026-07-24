'use client'

import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChatMessage } from '@/types/chat'

async function fetchChatHistory(contractId: string): Promise<ChatMessage[]> {
  const response = await fetch(`/api/contracts/${contractId}/chat`)
  if (!response.ok) return []
  const data = await response.json()
  return data.messages as ChatMessage[]
}

// Persists chat via the API and keeps the ['chat', contractId] cache
// updated optimistically, per docs/specs/06-contract-chat.md.
export function useChat(contractId: string) {
  const queryClient = useQueryClient()
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat', contractId],
    queryFn: () => fetchChatHistory(contractId),
  })

  const sendMessage = useCallback(
    async (text: string) => {
      setError(null)

      const optimisticMessage: ChatMessage = {
        id: `optimistic-${crypto.randomUUID()}`,
        session_id: '',
        user_id: '',
        role: 'user',
        content: text,
        page_citation: null,
        context_source: null,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<ChatMessage[]>(['chat', contractId], (old = []) => [
        ...old,
        optimisticMessage,
      ])

      setIsSending(true)
      try {
        const response = await fetch(`/api/contracts/${contractId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => null)
          throw new Error(body?.error?.message ?? 'Failed to get a response — try again.')
        }
        const data = await response.json()
        queryClient.setQueryData<ChatMessage[]>(['chat', contractId], (old = []) => [
          ...old,
          data.message as ChatMessage,
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get a response — try again.')
      } finally {
        setIsSending(false)
      }
    },
    [contractId, queryClient]
  )

  return { messages, sendMessage, isSending, isLoading, error }
}
