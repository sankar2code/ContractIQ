'use client'

import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface CustomTermInputProps {
  value: string[]
  onChange: (terms: string[]) => void
  max: number
  disabled?: boolean
}

export function CustomTermInput({ value, onChange, max, disabled }: CustomTermInputProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  function addTerm() {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (trimmed.length > 80) {
      setError('Term names must be 80 characters or fewer.')
      return
    }
    if (value.some((term) => term.toLowerCase() === trimmed.toLowerCase())) {
      setError('That term is already in your list.')
      return
    }
    if (value.length >= max) {
      setError(`You can add up to ${max} custom terms.`)
      return
    }
    onChange([...value, trimmed])
    setDraft('')
    setError(null)
  }

  function removeTerm(term: string) {
    onChange(value.filter((t) => t !== term))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      addTerm()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-ink-900">Add a custom key term (optional)</h2>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((term) => (
            <Badge key={term} tone="brand" className="pr-1">
              {term}
              <button
                type="button"
                onClick={() => removeTerm(term)}
                disabled={disabled}
                aria-label={`Remove ${term}`}
                className="ml-1 rounded-full p-0.5 hover:bg-indigo-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      {value.length < max ? (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Non-compete radius"
            disabled={disabled}
            maxLength={80}
            aria-label="Custom term name"
          />
          <Button type="button" variant="ghost" size="sm" onClick={addTerm} disabled={disabled}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      ) : (
        <p className="text-xs text-ink-500">Maximum of {max} custom terms reached.</p>
      )}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  )
}
