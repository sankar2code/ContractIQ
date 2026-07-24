import * as React from 'react'
import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-ink-100 bg-paper-white p-6 shadow-sm',
        className
      )}
      {...props}
    />
  )
}

export { Card }
