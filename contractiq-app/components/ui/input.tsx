import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-sm border border-ink-300 bg-paper-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
