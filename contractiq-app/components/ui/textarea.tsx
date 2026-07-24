import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-sm border border-ink-300 bg-paper-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export { Textarea }
