import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/security/authGuard'
import { createAdminClient } from '@/lib/supabase/admin'
import { errorResponse } from '@/lib/errors'

export const runtime = 'nodejs'

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60

// GET /api/contracts/{id}/signed-url — refresh the 1-hour PDF signed URL.
// See docs/specs/04-results-display.md.
export async function GET(
  request: Request,
  { params }: { params: { contractId: string } }
) {
  const auth = await requireAuth()
  if ('response' in auth) return auth.response
  const { user } = auth

  const supabase = createClient()
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('file_path')
    .eq('id', params.contractId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !contract) {
    return errorResponse('NOT_FOUND', 'Contract not found.', 404)
  }

  if (!contract.file_path) {
    return NextResponse.json({ signed_url: null, expires_at: null })
  }

  const admin = createAdminClient()
  const { data: signed, error: signError } = await admin.storage
    .from('contracts')
    .createSignedUrl(contract.file_path, SIGNED_URL_EXPIRY_SECONDS)

  if (signError || !signed) {
    return NextResponse.json({ signed_url: null, expires_at: null })
  }

  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000).toISOString()
  return NextResponse.json({ signed_url: signed.signedUrl, expires_at: expiresAt })
}
