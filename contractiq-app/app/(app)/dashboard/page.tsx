'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useContracts, type ContractsOrder, type ContractsSort } from '@/hooks/use-contracts'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { ContractsTable } from '@/components/dashboard/contracts-table'
import { EmptyDashboardState } from '@/components/dashboard/empty-dashboard-state'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const [sort, setSort] = useState<ContractsSort>('date')
  const [order, setOrder] = useState<ContractsOrder>('desc')
  const { data, isLoading, isError } = useContracts(sort, order)

  function handleSortChange(nextSort: ContractsSort) {
    if (nextSort === sort) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(nextSort)
      setOrder('desc')
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-700">Your contract review history at a glance.</p>
        </div>
        {data && data.total > 0 ? (
          <Link href="/contracts/upload" className={cn(buttonVariants({ variant: 'primary' }))}>
            Review a contract
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-500">Loading your contracts…</p>
      ) : isError ? (
        <p className="text-sm text-red-500">Could not load your contracts. Please refresh.</p>
      ) : !data || data.total === 0 ? (
        <EmptyDashboardState />
      ) : (
        <div className="flex flex-col gap-6">
          <SummaryCards
            total={data.total}
            byType={data.by_type}
            recent={data.contracts.slice(0, 5)}
          />
          <ContractsTable
            contracts={data.contracts}
            sort={sort}
            order={order}
            onSortChange={handleSortChange}
          />
        </div>
      )}
    </main>
  )
}
