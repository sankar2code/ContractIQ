'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

async function deleteContract(contractId: string) {
  const response = await fetch(`/api/contracts/${contractId}`, { method: 'DELETE' })
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message ?? 'Could not delete the contract.')
  }
}

export function useDeleteContract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    },
  })
}
