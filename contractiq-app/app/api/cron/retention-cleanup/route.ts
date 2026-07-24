import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { errorResponse } from '@/lib/errors'

export const runtime = 'nodejs'
export const maxDuration = 60

const RETENTION_DAYS = 90
const BATCH_SIZE = 100

// POST /api/cron/retention-cleanup — daily sweep that deletes contracts (and
// their Storage objects) whose last_accessed_at is older than 90 days.
// Protected by a shared secret (Vercel Cron sends this automatically as a
// Bearer token when the CRON_SECRET env var is set) — never reachable by an
// authenticated user session. See docs/specs/09-contract-deletion-and-retention.md.
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return errorResponse('UNAUTHORIZED', 'Invalid cron secret.', 401)
  }

  const admin = createAdminClient()
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data: staleContracts, error } = await admin
    .from('contracts')
    .select('id, file_path')
    .lt('last_accessed_at', cutoff)
    .limit(BATCH_SIZE)

  if (error) {
    return errorResponse('INTERNAL_ERROR', 'Could not query stale contracts.', 500)
  }

  let deletedCount = 0

  for (const contract of staleContracts ?? []) {
    if (contract.file_path) {
      try {
        await admin.storage.from('contracts').remove([contract.file_path])
      } catch {
        // Non-blocking — the row delete still proceeds; an orphaned object
        // is acceptable and will not block subsequent sweeps.
      }
    }
    const { error: deleteError } = await admin.from('contracts').delete().eq('id', contract.id)
    if (!deleteError) deletedCount += 1
  }

  return NextResponse.json({ deleted: deletedCount, checked: staleContracts?.length ?? 0 })
}
