'use client'

import { useEffect, useMemo, useRef } from 'react'

interface TextViewerFallbackProps {
  contractText: string
  targetPage: number | null
}

interface ParsedPage {
  pageNumber: number
  text: string
}

function parsePages(contractText: string): ParsedPage[] {
  const matches = [...contractText.matchAll(/\[PAGE (\d+)\]\n?/g)]

  if (matches.length === 0) {
    return [{ pageNumber: 1, text: contractText.trim() }]
  }

  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length
    const end = index + 1 < matches.length ? matches[index + 1].index : contractText.length
    return {
      pageNumber: Number(match[1]),
      text: contractText.slice(start, end).trim(),
    }
  })
}

// Fallback viewer used when Storage/the signed PDF URL is unavailable —
// renders contract_text split on its [PAGE N] markers with the same
// page-navigation contract as PdfViewer. See docs/specs/04-results-display.md.
export function TextViewerFallback({ contractText, targetPage }: TextViewerFallbackProps) {
  const pages = useMemo(() => parsePages(contractText), [contractText])
  const pageRefs = useRef<Map<number, HTMLElement>>(new Map())

  useEffect(() => {
    if (!targetPage) return
    const target = pageRefs.current.get(targetPage)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [targetPage])

  return (
    <div className="flex h-full flex-col rounded-lg border border-ink-100 bg-paper-white">
      <div className="border-b border-ink-100 px-4 py-2">
        <span className="text-xs text-ink-500">
          Text view — the PDF preview isn&apos;t available for this contract
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          {pages.map((page) => (
            <section
              key={page.pageNumber}
              id={`page-${page.pageNumber}`}
              ref={(el) => {
                if (el) pageRefs.current.set(page.pageNumber, el)
              }}
              className={
                page.pageNumber === targetPage
                  ? 'rounded-doc bg-indigo-50 p-4 ring-2 ring-indigo-500'
                  : 'rounded-doc p-4'
              }
            >
              <p className="font-mono text-xs font-medium text-ink-500">
                Page {page.pageNumber}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-900">
                {page.text}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
