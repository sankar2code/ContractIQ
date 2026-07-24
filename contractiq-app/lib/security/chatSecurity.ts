import { createClient } from '@/lib/supabase/server'
import type { ContractStatus } from '@/types/contract'

export interface OwnedContract {
  id: string
  contract_text: string
  status: ContractStatus
}

// Verifies the contract exists AND belongs to the caller before any chat
// operation touches it, per docs/specs/06-contract-chat.md. RLS enforces
// the same `user_id = auth.uid()` scoping independently at the database
// layer — this is the application-layer check that lets the route return a
// clean 404 (contract not found) instead of relying solely on RLS silently
// returning zero rows further down the call chain.
export async function verifyContractOwnership(
  contractId: string,
  userId: string
): Promise<OwnedContract | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contracts')
    .select('id, contract_text, status')
    .eq('id', contractId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  return data
}

export interface OwnedSession {
  id: string
}

// Verifies an existing chat session belongs to the caller. Does not create
// one — the chat route's get-or-create flow still owns creation; this is
// purely the ownership check for an existing session.
export async function verifySessionOwnership(
  contractId: string,
  userId: string
): Promise<OwnedSession | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('contract_id', contractId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  return data
}
