'use client'

import { useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-ink-100 p-3">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask a question about this contract…"
        disabled={disabled}
        maxLength={2000}
        aria-label="Chat message"
      />
      <Button type="submit" size="sm" disabled={disabled || !value.trim()} aria-label="Send">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
