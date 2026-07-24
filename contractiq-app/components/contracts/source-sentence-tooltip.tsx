'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SourceSentenceTooltipProps {
  sentence: string
}

export function SourceSentenceTooltip({ sentence }: SourceSentenceTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700"
        aria-expanded={isOpen}
      >
        Why?
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen ? (
        <blockquote className="mt-2 max-h-40 overflow-y-auto rounded-doc border-l-2 border-indigo-300 bg-indigo-50 px-3 py-2 text-xs italic leading-relaxed text-ink-700">
          &ldquo;{sentence}&rdquo;
        </blockquote>
      ) : null}
    </div>
  )
}
