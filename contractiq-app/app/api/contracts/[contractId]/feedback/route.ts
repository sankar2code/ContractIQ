import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/security/authGuard'
import { feedbackSchema } from '@/lib/validation/contracts'
import { errorResponse } from '@/lib/errors'

export const runtime = 'nodejs'

// POST /api/contracts/{id}/feedback — thumbs up/down + optional comment.
// See docs/specs/08-feedback.md.
export async function POST(
  request: Request,
  { params }: { params: { contractId: string } }
) {
  const auth = await requireAuth()
  if ('response' in auth) return auth.response
  const { user } = auth

  const body = await request.json().catch(() => null)
  const parsed = feedbackSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', 'Provide a valid rating.', 400)
  }

  const supabase = createClient()

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id')
    .eq('id', params.contractId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (contractError || !contract) {
    return errorResponse('NOT_FOUND', 'Contract not found.', 404)
  }

  const { data: feedback, error: insertError } = await supabase
    .from('user_feedback')
    .insert({
      contract_id: contract.id,
      user_id: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    })
    .select('id, rating, comment, created_at')
    .single()

  if (insertError || !feedback) {
    return errorResponse('INTERNAL_ERROR', 'Could not save your feedback.', 500)
  }

  return NextResponse.json({ feedback }, { status: 201 })
}
