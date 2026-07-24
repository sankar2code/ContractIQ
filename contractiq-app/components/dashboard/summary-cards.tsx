import { Card } from '@/components/ui/card'
import type { ContractSummary } from '@/types/contract'

interface SummaryCardsProps {
  total: number
  byType: { nda: number; msa: number }
  recent: ContractSummary[]
}

export function SummaryCards({ total, byType, recent }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Total reviewed</p>
        <p className="mt-2 text-3xl font-semibold text-ink-900">{total}</p>
      </Card>
      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">By type</p>
        <p className="mt-2 text-sm text-ink-700">
          <span className="font-semibold text-ink-900">{byType.nda}</span> NDA ·{' '}
          <span className="font-semibold text-ink-900">{byType.msa}</span> MSA
        </p>
      </Card>
      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Most recent</p>
        {recent.length > 0 ? (
          <p className="mt-2 truncate text-sm text-ink-700">{recent[0].file_name}</p>
        ) : (
          <p className="mt-2 text-sm text-ink-500">No contracts yet</p>
        )}
      </Card>
    </div>
  )
}
