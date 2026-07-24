import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Generic badge primitive. The product-specific ConfidenceBadge (score ->
// tier dot + % + label, components/contracts/confidence-badge.tsx) is built
// on top of this rather than extending it.
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-ink-100 text-ink-700',
        brand: 'bg-indigo-100 text-indigo-700',
        success: 'bg-green-100 text-green-900',
        warning: 'bg-amber-100 text-amber-900',
        danger: 'bg-red-100 text-red-900',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export { Badge, badgeVariants }
