import { createAdminClient } from '@/lib/supabase/admin'

// Supabase-backed sliding-window rate limiter, replacing the previous
// in-memory implementation (lib/rate-limit.ts, removed). The in-memory
// version only tracked state within a single Node process — on a
// multi-instance serverless deployment (Vercel), each instance had its own
// independent counter, so a user's requests spread across instances could
// exceed the intended limit by a factor of however many instances were
// running. This version is backed by the rate_limit_events table
// (supabase/rls-policies.sql) so the count is shared and correct across
// every instance.
export type RateLimitAction = 'contract_upload' | 'contract_process' | 'chat'

interface RateLimitConfig {
  limit: number
  windowMs: number
}

// Limits per docs/security/security-plan.md — contract_process and chat are
// the OpenAI-cost-bearing routes; contract_upload is the highest-value
// abuse target since it was previously completely unlimited.
const RATE_LIMITS: Record<RateLimitAction, RateLimitConfig> = {
  contract_upload: { limit: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20 / day
  contract_process: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 / hour
  chat: { limit: 30, windowMs: 60 * 1000 }, // 30 / minute
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

// Reads and writes exclusively via the service-role client — no RLS policy
// exists on rate_limit_events for the regular (anon/authenticated) role at
// all, so a user cannot read, delete, or otherwise manipulate their own
// count even if they inspected network requests; the table is invisible to
// them entirely.
export async function checkRateLimit(
  userId: string,
  action: RateLimitAction
): Promise<RateLimitResult> {
  const { limit, windowMs } = RATE_LIMITS[action]
  const admin = createAdminClient()
  const windowStart = new Date(Date.now() - windowMs).toISOString()

  const { count, error } = await admin
    .from('rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart)

  if (error) {
    // Fail open: a broken rate limiter must never take the whole app down.
    // The cost exposure of a brief limiter outage is far smaller than
    // blocking every request for every user because of it.
    console.error('[rateLimiter] check failed, failing open', { userId, action, error })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if ((count ?? 0) >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil(windowMs / 1000) }
  }

  const { error: insertError } = await admin
    .from('rate_limit_events')
    .insert({ user_id: userId, action })

  if (insertError) {
    console.error('[rateLimiter] record failed', { userId, action, insertError })
  }

  return { allowed: true, retryAfterSeconds: 0 }
}
