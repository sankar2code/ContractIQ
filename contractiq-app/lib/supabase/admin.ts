import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role Supabase client — SERVER ONLY, never import from a client
// component. Used to bypass RLS for signed-URL generation and Storage
// object management after the caller's session has already been verified,
// per docs/engineering/engineering-doc.md §6.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
