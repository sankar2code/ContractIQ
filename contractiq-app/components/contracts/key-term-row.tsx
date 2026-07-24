'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Pencil, X } from 'lucide-react'
import { ConfidenceBadge } from './confidence-badge'
import { SourceSentenceTooltip } from './source-sentence-tooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { KeyTerm } from '@/types/key-term'

interface KeyTermRowProps {
  term: KeyTerm
  onPageClick: (page: number) => void
  onEdit: (termId: string, value: string) => Promise<void>
}

// Covers docs/specs/04-results-display.md (display, confidence, page nav,
// "Why?" source sentence) and docs/specs/05-inline-key-term-editing.md
// (click-to-edit, "Edited" badge) — the two specs extend the same row.
export function KeyTermRow({ term, onPageClick, onEdit }: KeyTermRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(term.value)
  const [isSaving, setIsSaving] = useState(false)
  const isLowConfidence = term.confidence_score < 50

  async function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed) {
      setDraft(term.value)
      setIsEditing(false)
      return
    }
    if (trimmed === term.value) {
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    await onEdit(term.id, trimmed)
    setIsSaving(false)
    setIsEditing(false)
  }

  function handleCancel() {
    setDraft(term.value)
    setIsEditing(false)
  }

  return (
    <div className="border-b border-ink-100 py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink-900">{term.term_name}</h3>
            {term.is_custom ? (
              <span className="rounded-pill bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                Custom
              </span>
            ) : null}
            {term.edited ? (
              <span className="rounded-pill bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700">
                Edited
              </span>
            ) : null}
          </div>

          {isEditing ? (
            <div className="mt-2 flex items-center gap-2">
              <Input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSave()
                  if (event.key === 'Escape') handleCancel()
                }}
                disabled={isSaving}
                className="text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                aria-label="Save"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                aria-label="Cancel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="group mt-1 flex items-start gap-1.5 text-left text-sm leading-relaxed text-ink-700 hover:text-ink-900"
            >
              <span>{term.value}</span>
              <Pencil className="mt-1 h-3 w-3 shrink-0 text-ink-300 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ConfidenceBadge score={term.confidence_score} />
          <button
            type="button"
            onClick={() => onPageClick(term.page_number)}
            className="font-mono text-xs font-medium text-indigo-500 hover:text-indigo-700"
          >
            Page {term.page_number}
          </button>
        </div>
      </div>

      {isLowConfidence ? (
        <div className="mt-2 flex items-start gap-1.5 rounded-doc bg-red-50 px-2.5 py-2 text-xs text-red-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Low confidence — we recommend verifying this in the document directly.</span>
        </div>
      ) : null}

      <div className="mt-2">
        <SourceSentenceTooltip sentence={term.source_sentence} />
      </div>
    </div>
  )
}
