import { cn } from '@/lib/utils'

interface ConfidenceBadgeProps {
  score: number
  className?: string
}

function tierFor(score: number) {
  if (score >= 80) {
    return { label: 'High confidence', dot: 'bg-green-500', text: 'text-green-900', bg: 'bg-green-50' }
  }
  if (score >= 50) {
    return { label: 'Medium confidence', dot: 'bg-amber-500', text: 'text-amber-900', bg: 'bg-amber-50' }
  }
  return { label: 'Low confidence', dot: 'bg-red-500', text: 'text-red-900', bg: 'bg-red-50' }
}

// Signature component: score -> tier dot + % + label, per docs/design.md.
// Color is never the only signal — the numeric % and tier word are always shown too.
export function ConfidenceBadge({ score, className }: ConfidenceBadgeProps) {
  const tier = tierFor(score)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 font-mono text-xs font-medium',
        tier.bg,
        tier.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', tier.dot)} aria-hidden="true" />
      {Math.round(score)}% · {tier.label}
    </span>
  )
}
