import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/security/authGuard'
import { customTermsRequestSchema } from '@/lib/validation/contracts'
import { errorResponse } from '@/lib/errors'

export const runtime = 'nodejs'

// POST /api/contracts/{id}/custom-terms — register up to 5 custom key terms
// before processing. See docs/specs/02-contract-upload-and-preprocessing.md.
export async function POST(
  request: Request,
  { params }: { params: { contractId: string } }
) {
  const auth = await requireAuth()
  if ('response' in auth) return auth.response
  const { user } = auth

  const body = await request.json().catch(() => null)
  const parsed = customTermsRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', 'Provide 1–5 custom term names.', 400)
  }

  const uniqueTerms = Array.from(
    new Set(parsed.data.terms.map((term) => term.trim()))
  )

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

  const { count: existingCount } = await supabase
    .from('custom_key_terms')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', params.contractId)

  if ((existingCount ?? 0) + uniqueTerms.length > 5) {
    return errorResponse('VALIDATION_ERROR', 'A contract can have at most 5 custom terms.', 400)
  }

  const rows = uniqueTerms.map((term_name) => ({
    contract_id: params.contractId,
    user_id: user.id,
    term_name,
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('custom_key_terms')
    .insert(rows)
    .select('id, term_name')

  if (insertError) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Could not save custom terms — a term with that name may already exist.',
      400
    )
  }

  return NextResponse.json({ custom_terms: inserted }, { status: 200 })
}
