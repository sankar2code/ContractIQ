import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/security/authGuard'
import { extractTerms } from '@/lib/openai/extraction'
import { standardTermsFor } from '@/lib/openai/prompts/terms'
import { checkRateLimit } from '@/lib/security/rateLimiter'
import { errorResponse } from '@/lib/errors'
import type { ContractType } from '@/types/contract'

export const runtime = 'nodejs'
export const maxDuration = 60

// POST /api/contracts/{id}/process — GPT-4o key term extraction.
// See docs/specs/03-key-term-extraction.md.
export async function POST(
  request: Request,
  { params }: { params: { contractId: string } }
) {
  const auth = await requireAuth()
  if ('response' in auth) return auth.response
  const { user } = auth

  const rateLimit = await checkRateLimit(user.id, 'contract_process')
  if (!rateLimit.allowed) {
    return errorResponse(
      'RATE_LIMITED',
      'Too many requests — please wait a moment before processing another contract.',
      429,
      { 'Retry-After': String(rateLimit.retryAfterSeconds) }
    )
  }

  const supabase = createClient()

  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, contract_type, contract_text, page_count, status')
    .eq('id', params.contractId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError || !contract) {
    return errorResponse('NOT_FOUND', 'Contract not found.', 404)
  }

  if (contract.status !== 'uploaded' && contract.status !== 'error') {
    return errorResponse('ALREADY_PROCESSING', 'This contract is already being processed.', 409)
  }

  await supabase.from('contracts').update({ status: 'processing' }).eq('id', contract.id)

  const { data: customTermRows } = await supabase
    .from('custom_key_terms')
    .select('term_name')
    .eq('contract_id', contract.id)

  const contractType = contract.contract_type as ContractType
  const customTermNames = new Set((customTermRows ?? []).map((row) => row.term_name))
  const termTargets = [...standardTermsFor(contractType), ...customTermNames]

  try {
    const { terms } = await extractTerms(contract.contract_text, termTargets, contractType)

    const rows = terms.map((term) => ({
      contract_id: contract.id,
      user_id: user.id,
      term_name: term.term_name,
      value: term.value,
      page_number: Math.min(Math.max(term.page_number, 1), contract.page_count),
      confidence_score: Math.round(term.confidence_score * 10000) / 100,
      source_sentence: term.source_sentence,
      is_custom: customTermNames.has(term.term_name),
    }))

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('key_terms').insert(rows)
      if (insertError) throw new Error(insertError.message)
    }

    await supabase.from('contracts').update({ status: 'completed' }).eq('id', contract.id)

    const { data: keyTerms } = await supabase
      .from('key_terms')
      .select('*')
      .eq('contract_id', contract.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({ status: 'completed', key_terms: keyTerms ?? [] }, { status: 200 })
  } catch (error) {
    console.error('[contracts/process] extraction failed', { contractId: contract.id, error })
    await supabase.from('contracts').update({ status: 'error' }).eq('id', contract.id)
    return errorResponse(
      'UPSTREAM_ERROR',
      'We could not analyse this contract right now. Please try again in a few minutes.',
      502
    )
  }
}
