'use client'

import { useMutation } from '@tanstack/react-query'

interface SubmitFeedbackInput {
  contractId: string
  rating: 'up' | 'down'
  comment?: string
}

async function submitFeedback({ contractId, rating, comment }: SubmitFeedbackInput) {
  const response = await fetch(`/api/contracts/${contractId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, comment }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message ?? 'Could not save your feedback.')
  }
  return response.json()
}

export function useSubmitFeedback(contractId: string) {
  return useMutation({
    mutationFn: (input: { rating: 'up' | 'down'; comment?: string }) =>
      submitFeedback({ contractId, ...input }),
  })
}
