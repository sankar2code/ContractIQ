import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/security/authGuard'
import { keyTermUpdateSchema } from '@/lib/validation/contracts'
import { errorResponse } from '@/lib/errors'

export const runtime = 'nodejs'

// PATCH /api/contracts/{id}/key-terms/{termId} — inline term correction.
// See docs/specs/05-inline-key-term-editing.md.
export async function PATCH(
  request: Request,
  { params }: { params: { contractId: string; termId: string } }
) {
  const auth = await requireAuth()
  if ('response' in auth) return auth.response
  const { user } = auth

  const body = await request.json().catch(() => null)
  const parsed = keyTermUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', 'Provide a non-empty value.', 400)
  }

  const supabase = createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('key_terms')
    .select('id, value, original_ai_value')
    .eq('id', params.termId)
    .eq('contract_id', params.contractId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError || !existing) {
    return errorResponse('NOT_FOUND', 'Key term not found.', 404)
  }

  // original_ai_value is set exactly once — on the first edit — so later
  // edits never overwrite the true original AI output.
  const { data: updated, error: updateError } = await supabase
    .from('key_terms')
    .update({
      value: parsed.data.value,
      edited: true,
      original_ai_value: existing.original_ai_value ?? existing.value,
    })
    .eq('id', existing.id)
    .select('*')
    .single()

  if (updateError || !updated) {
    return errorResponse('INTERNAL_ERROR', 'Could not save this edit. Please try again.', 500)
  }

  return NextResponse.json({ key_term: updated })
}
