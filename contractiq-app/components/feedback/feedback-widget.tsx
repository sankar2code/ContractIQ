'use client'

import { useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useSubmitFeedback } from '@/hooks/use-submit-feedback'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface FeedbackWidgetProps {
  contractId: string
}

export function FeedbackWidget({ contractId }: FeedbackWidgetProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [comment, setComment] = useState('')
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false)
  const submitFeedback = useSubmitFeedback(contractId)
  const { toast } = useToast()

  async function handleRate(nextRating: 'up' | 'down') {
    setRating(nextRating)
    try {
      await submitFeedback.mutateAsync({ rating: nextRating })
      setHasSubmittedRating(true)
      toast({ title: 'Thanks for the feedback.', variant: 'success' })
    } catch (err) {
      toast({
        title: "Couldn't submit feedback",
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  async function handleCommentSubmit() {
    if (!rating || !comment.trim()) return
    try {
      await submitFeedback.mutateAsync({ rating, comment: comment.trim() })
      toast({ title: 'Thanks for the extra detail.', variant: 'success' })
      setComment('')
    } catch (err) {
      toast({
        title: "Couldn't submit comment",
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="rounded-lg border border-ink-100 bg-paper-white p-4">
      <p className="text-sm font-medium text-ink-900">Were the extracted terms accurate?</p>
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleRate('up')}
          className={cn(rating === 'up' && 'border-indigo-500 text-indigo-500')}
          aria-pressed={rating === 'up'}
          aria-label="Thumbs up"
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleRate('down')}
          className={cn(rating === 'down' && 'border-indigo-500 text-indigo-500')}
          aria-pressed={rating === 'down'}
          aria-label="Thumbs down"
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>

      {hasSubmittedRating ? (
        <div className="mt-3 flex flex-col gap-2">
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Anything else you'd like to share? (optional)"
            maxLength={1000}
            rows={2}
          />
          {comment.trim() ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCommentSubmit}
              className="self-start"
            >
              Send comment
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
