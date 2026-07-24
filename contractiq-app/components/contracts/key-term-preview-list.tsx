import { Badge } from '@/components/ui/badge'
import { standardTermsFor } from '@/lib/openai/prompts/terms'
import type { ContractType } from '@/types/contract'

interface KeyTermPreviewListProps {
  contractType: ContractType
  customTerms: string[]
}

export function KeyTermPreviewList({ contractType, customTerms }: KeyTermPreviewListProps) {
  const standardTerms = standardTermsFor(contractType)

  return (
    <div>
      <h2 className="text-sm font-semibold text-ink-900">ContractIQ will look for these terms</h2>
      <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {standardTerms.map((term) => (
          <li key={term} className="text-sm text-ink-700">
            {term}
          </li>
        ))}
        {customTerms.map((term) => (
          <li key={term} className="flex items-center gap-2 text-sm text-ink-700">
            {term}
            <Badge tone="brand">Custom</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
