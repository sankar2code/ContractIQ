'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ContractDetailResponse } from './use-contract'
import type { KeyTerm } from '@/types/key-term'

interface UpdateKeyTermInput {
  contractId: string
  termId: string
  value: string
}

async function updateKeyTerm({
  contractId,
  termId,
  value,
}: UpdateKeyTermInput): Promise<KeyTerm> {
  const response = await fetch(`/api/contracts/${contractId}/key-terms/${termId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message ?? "Couldn't save your edit — try again.")
  }
  const data = await response.json()
  return data.key_term as KeyTerm
}

// Optimistic update against the ['contract', contractId] cache, with
// rollback on failure, per docs/specs/05-inline-key-term-editing.md.
export function useUpdateKeyTerm(contractId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { termId: string; value: string }) =>
      updateKeyTerm({ contractId, ...input }),
    onMutate: async ({ termId, value }) => {
      await queryClient.cancelQueries({ queryKey: ['contract', contractId] })
      const previous = queryClient.getQueryData<ContractDetailResponse>(['contract', contractId])

      queryClient.setQueryData<ContractDetailResponse | undefined>(
        ['contract', contractId],
        (old) => {
          if (!old) return old
          return {
            ...old,
            key_terms: old.key_terms.map((term) =>
              term.id === termId ? { ...term, value, edited: true } : term
            ),
          }
        }
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['contract', contractId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] })
    },
  })
}
