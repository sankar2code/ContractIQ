import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-indigo-500 text-white hover:scale-[1.03]',
        ghost: 'border border-ink-300 text-ink-900 hover:border-ink-500',
        destructive: 'bg-red-500 text-white hover:scale-[1.03]',
      },
      size: {
        default: 'px-8 py-3 text-base',
        sm: 'px-5 py-2 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
