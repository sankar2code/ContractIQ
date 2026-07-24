import { createBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client — used directly by client components for
// auth (sign up / sign in / sign out) and RLS-scoped reads, per
// docs/engineering/engineering-doc.md §6.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
