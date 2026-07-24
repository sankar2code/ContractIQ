import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/security/authGuard'
import { contractsListQuerySchema } from '@/lib/validation/contracts'
import { errorResponse } from '@/lib/errors'

export const runtime = 'nodejs'

const SORT_COLUMN: Record<string, string> = {
  date: 'created_at',
  name: 'file_name',
  type: 'contract_type',
}

// GET /api/contracts — dashboard list. See docs/specs/07-dashboard.md.
export async function GET(request: Request) {
  const auth = await requireAuth()
  if ('response' in auth) return auth.response
  const { user } = auth

  const url = new URL(request.url)
  const parsedQuery = contractsListQuerySchema.safeParse({
    sort: url.searchParams.get('sort') ?? undefined,
    order: url.searchParams.get('order') ?? undefined,
  })

  if (!parsedQuery.success) {
    return errorResponse('VALIDATION_ERROR', 'Invalid sort/order parameters.', 400)
  }

  const { sort, order } = parsedQuery.data
  const supabase = createClient()

  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('id, contract_type, file_name, status, created_at')
    .eq('user_id', user.id)
    .order(SORT_COLUMN[sort], { ascending: order === 'asc' })

  if (error) {
    return errorResponse('INTERNAL_ERROR', 'Could not load your contracts.', 500)
  }

  const total = contracts?.length ?? 0
  const byType = {
    nda: contracts?.filter((row) => row.contract_type === 'nda').length ?? 0,
    msa: contracts?.filter((row) => row.contract_type === 'msa').length ?? 0,
  }

  return NextResponse.json({ contracts: contracts ?? [], total, by_type: byType })
}
