import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/security/authGuard'
import { createAdminClient } from '@/lib/supabase/admin'
import { errorResponse } from '@/lib/errors'

export const runtime = 'nodejs'

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60 // 1 hour, per engineering-doc §7

// GET /api/contracts/{id} — contract detail + key terms + signed URL.
// See docs/specs/04-results-display.md.
export async function GET(
  request: Request,
  { params }: { params: { contractId: string } }
) {
  const auth = await requireAuth()
  if ('response' in auth) return auth.response
  const { user } = auth

  const supabase = createClient()

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', params.contractId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (contractError || !contract) {
    return errorResponse('NOT_FOUND', 'Contract not found.', 404)
  }

  // Resets the 90-day retention clock on every view, per
  // docs/specs/09-contract-deletion-and-retention.md.
  await supabase
    .from('contracts')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', contract.id)

  const { data: keyTerms } = await supabase
    .from('key_terms')
    .select('*')
    .eq('contract_id', contract.id)
    .order('created_at', { ascending: true })

  let signedUrl: string | null = null
  if (contract.file_path) {
    try {
      const admin = createAdminClient()
      const { data: signed } = await admin.storage
        .from('contracts')
        .createSignedUrl(contract.file_path, SIGNED_URL_EXPIRY_SECONDS)
      signedUrl = signed?.signedUrl ?? null
    } catch {
      signedUrl = null
    }
  }

  return NextResponse.json({ contract, key_terms: keyTerms ?? [], signed_url: signedUrl })
}

// DELETE /api/contracts/{id} — user-initiated deletion.
// See docs/specs/09-contract-deletion-and-retention.md.
export async function DELETE(
  request: Request,
  { params }: { params: { contractId: string } }
) {
  const auth = await requireAuth()
  if ('response' in auth) return auth.response
  const { user } = auth

  const supabase = createClient()

  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, file_path')
    .eq('id', params.contractId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (contractError || !contract) {
    return errorResponse('NOT_FOUND', 'Contract not found.', 404)
  }

  if (contract.file_path) {
    try {
      const admin = createAdminClient()
      await admin.storage.from('contracts').remove([contract.file_path])
    } catch {
      // Storage delete failures are non-blocking — the DB delete still
      // proceeds; an orphaned object is caught by the retention sweep.
    }
  }

  const { error: deleteError } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contract.id)
    .eq('user_id', user.id)

  if (deleteError) {
    return errorResponse('INTERNAL_ERROR', 'Could not delete the contract. Please try again.', 500)
  }

  return new NextResponse(null, { status: 204 })
}
