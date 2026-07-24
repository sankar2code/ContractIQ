import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { errorResponse } from '@/lib/errors'

type AuthResult = { user: User } | { response: NextResponse }

// Centralized session check for every Route Handler. Reads the session
// cookie via the server Supabase client and returns either the
// authenticated user or a ready-to-return 401 response — callers cannot
// forget the check or drift on the error message, since there's exactly
// one call site for both.
//
// Usage:
//   const auth = await requireAuth()
//   if ('response' in auth) return auth.response
//   const { user } = auth
export async function requireAuth(): Promise<AuthResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { response: errorResponse('UNAUTHORIZED', 'Sign in to continue.', 401) }
  }

  return { user }
}
