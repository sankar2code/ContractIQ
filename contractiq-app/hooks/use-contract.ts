'use client'

import { useQuery } from '@tanstack/react-query'
import type { Contract } from '@/types/contract'
import type { KeyTerm } from '@/types/key-term'

export interface ContractDetailResponse {
  contract: Contract
  key_terms: KeyTerm[]
  signed_url: string | null
}

async function fetchContract(contractId: string): Promise<ContractDetailResponse> {
  const response = await fetch(`/api/contracts/${contractId}`)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error?.message ?? 'This contract is no longer available.')
  }
  return response.json()
}

export function useContract(contractId: string) {
  return useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => fetchContract(contractId),
  })
}
