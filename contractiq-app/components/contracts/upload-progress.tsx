import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UploadStep } from '@/hooks/use-upload-contract'

const STEPS: { key: UploadStep; label: string }[] = [
  { key: 'uploading', label: 'Extracting text' },
  { key: 'extracting-ai', label: 'Analysing with AI' },
  { key: 'done', label: 'Compiling results' },
]

interface UploadProgressProps {
  step: UploadStep
}

export function UploadProgress({ step }: UploadProgressProps) {
  const activeIndex = STEPS.findIndex((item) => item.key === step)

  return (
    <ol className="flex flex-col gap-3" aria-live="polite">
      {STEPS.map((item, index) => {
        const isComplete = activeIndex > index || step === 'done'
        const isActive = activeIndex === index && step !== 'done'
        return (
          <li key={item.key} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                isComplete
                  ? 'border-green-500 bg-green-500 text-white'
                  : isActive
                    ? 'border-indigo-500 text-indigo-500'
                    : 'border-ink-300 text-ink-500'
              )}
            >
              {isComplete ? (
                <Check className="h-3.5 w-3.5" />
              ) : isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                index + 1
              )}
            </span>
            <span className={cn(isActive ? 'font-medium text-ink-900' : 'text-ink-700')}>
              {item.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
