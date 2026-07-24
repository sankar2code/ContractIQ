import { KeyTermRow } from './key-term-row'
import type { KeyTerm } from '@/types/key-term'

interface KeyTermsPanelProps {
  terms: KeyTerm[]
  onPageClick: (page: number) => void
  onEdit: (termId: string, value: string) => Promise<void>
}

export function KeyTermsPanel({ terms, onPageClick, onEdit }: KeyTermsPanelProps) {
  if (terms.length === 0) {
    return (
      <div className="rounded-lg border border-ink-100 bg-paper-white p-6 text-sm text-ink-700">
        No key terms were extracted for this contract.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-ink-100 bg-paper-white p-6">
      <h2 className="text-sm font-semibold text-ink-900">Key terms</h2>
      <div className="mt-2">
        {terms.map((term) => (
          <KeyTermRow key={term.id} term={term} onPageClick={onPageClick} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}
