'use client'

import { useQuery } from '@tanstack/react-query'
import type { ContractSummary } from '@/types/contract'

export type ContractsSort = 'date' | 'name' | 'type'
export type ContractsOrder = 'asc' | 'desc'

interface ContractsListResponse {
  contracts: ContractSummary[]
  total: number
  by_type: { nda: number; msa: number }
}

async function fetchContracts(
  sort: ContractsSort,
  order: ContractsOrder
): Promise<ContractsListResponse> {
  const response = await fetch(`/api/contracts?sort=${sort}&order=${order}`)
  if (!response.ok) {
    throw new Error('Could not load your contracts.')
  }
  return response.json()
}

export function useContracts(sort: ContractsSort, order: ContractsOrder) {
  return useQuery({
    queryKey: ['contracts', sort, order],
    queryFn: () => fetchContracts(sort, order),
  })
}
