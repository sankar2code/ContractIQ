'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DeleteContractDialog } from '@/components/contracts/delete-contract-dialog'
import { useDeleteContract } from '@/hooks/use-delete-contract'
import { useToast } from '@/hooks/use-toast'
import type { ContractSummary, ContractStatus } from '@/types/contract'
import type { ContractsOrder, ContractsSort } from '@/hooks/use-contracts'

interface ContractsTableProps {
  contracts: ContractSummary[]
  sort: ContractsSort
  order: ContractsOrder
  onSortChange: (sort: ContractsSort) => void
}

const COLUMNS: { key: ContractsSort; label: string }[] = [
  { key: 'name', label: 'Contract' },
  { key: 'type', label: 'Type' },
  { key: 'date', label: 'Date uploaded' },
]

const STATUS_TONE: Record<ContractStatus, 'neutral' | 'warning' | 'danger' | 'success'> = {
  uploaded: 'neutral',
  processing: 'warning',
  completed: 'success',
  error: 'danger',
}

const STATUS_LABEL: Record<ContractStatus, string> = {
  uploaded: 'Uploaded',
  processing: 'Processing',
  completed: 'Completed',
  error: 'Error',
}

export function ContractsTable({ contracts, sort, order, onSortChange }: ContractsTableProps) {
  const router = useRouter()
  const deleteContract = useDeleteContract()
  const { toast } = useToast()

  async function handleDelete(contractId: string) {
    try {
      await deleteContract.mutateAsync(contractId)
      toast({ title: 'Contract deleted.', variant: 'success' })
    } catch (err) {
      toast({
        title: "Couldn't delete this contract",
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-ink-100 bg-paper-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink-100 bg-ink-50">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column.key} className="px-4 py-3 font-medium text-ink-700">
                <button
                  type="button"
                  onClick={() => onSortChange(column.key)}
                  className="flex items-center gap-1 hover:text-ink-900"
                >
                  {column.label}
                  {sort === column.key ? (
                    order === 'asc' ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : null}
                </button>
              </th>
            ))}
            <th className="px-4 py-3 font-medium text-ink-700">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr
              key={contract.id}
              onClick={() => router.push(`/contracts/${contract.id}`)}
              className="cursor-pointer border-b border-ink-100 last:border-b-0 hover:bg-indigo-50/40"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/contracts/${contract.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="block max-w-xs truncate font-medium text-ink-900"
                >
                  {contract.file_name}
                </Link>
              </td>
              <td className="px-4 py-3 uppercase text-ink-700">{contract.contract_type}</td>
              <td className="px-4 py-3 text-ink-700">
                {new Date(contract.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[contract.status]}>{STATUS_LABEL[contract.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                <DeleteContractDialog
                  contractName={contract.file_name}
                  onConfirm={() => handleDelete(contract.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
