import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/security/authGuard'
import { getChatCompletion } from '@/lib/openai/chat'
import { chatMessageSchema } from '@/lib/validation/contracts'
import { checkRateLimit } from '@/lib/security/rateLimiter'
import { sanitizeForLLM } from '@/lib/security/promptInjectionGuard'
import { verifyContractOwnership } from '@/lib/security/chatSecurity'
import { MAX_CHAT_HISTORY } from '@/lib/security/tokenLimiter'
import { errorResponse } from '@/lib/errors'

export const runtime = 'nodejs'
export const maxDuration = 30

// GET /api/contracts/{id}/chat — load persisted chat history.
// See docs/specs/06-contract-chat.md.
export async function GET(
  request: Request,
  { params }: { params: { contractId: string } }
) {
  const auth = await requireAuth()
  if ('response' in auth) return auth.response
  const { user } = auth

  const contract = await verifyContractOwnership(params.contractId, user.id)
  if (!contract) {
    return errorResponse('NOT_FOUND', 'Contract not found.', 404)
  }

  const supabase = createClient()

  const { data: session } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('contract_id', contract.id)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ messages: [] })
  }

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })
    .limit(MAX_CHAT_HISTORY)

  return NextResponse.json({ messages: messages ?? [] })
}

// POST /api/contracts/{id}/chat — send a message, get a grounded response.
// See docs/specs/06-contract-chat.md.
export async function POST(
  request: Request,
  { params }: { params: { contractId: string } }
) {
  const auth = await requireAuth()
  if ('response' in auth) return auth.response
  const { user } = auth

  const rateLimit = await checkRateLimit(user.id, 'chat')
  if (!rateLimit.allowed) {
    return errorResponse('RATE_LIMITED', 'Too many messages — please wait a moment.', 429, {
      'Retry-After': String(rateLimit.retryAfterSeconds),
    })
  }

  const body = await request.json().catch(() => null)
  const parsed = chatMessageSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION_ERROR', 'Enter a message to send.', 400)
  }

  // Reject detected prompt-injection attempts before touching the database
  // or calling OpenAI at all — the message is never saved.
  const injectionCheck = sanitizeForLLM(parsed.data.message)
  if (injectionCheck.isSuspicious) {
    return errorResponse(
      'PROMPT_INJECTION',
      'This message could not be processed. Please rephrase your question about the contract.',
      400
    )
  }

  const contract = await verifyContractOwnership(params.contractId, user.id)
  if (!contract) {
    return errorResponse('NOT_FOUND', 'Contract not found.', 404)
  }

  // Chat is only meaningful once extraction has finished — a contract still
  // 'uploaded'/'processing', or one that ended in 'error', has no reliable
  // key-term context and shouldn't burn an OpenAI call.
  if (contract.status !== 'completed') {
    return errorResponse(
      'VALIDATION_ERROR',
      'This contract is still being processed — chat is available once processing completes.',
      422
    )
  }

  const supabase = createClient()

  let sessionId: string

  const { data: existingSession } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('contract_id', contract.id)
    .maybeSingle()

  if (existingSession) {
    sessionId = existingSession.id
  } else {
    const { data: createdSession, error: createError } = await supabase
      .from('chat_sessions')
      .insert({ contract_id: contract.id, user_id: user.id })
      .select('id')
      .single()

    if (createError || !createdSession) {
      return errorResponse('INTERNAL_ERROR', 'Could not start a chat session.', 500)
    }
    sessionId = createdSession.id
  }

  // CRITICAL: load the conversation history BEFORE the new user message is
  // saved. The Conversation Memory Layer classifies this new message against
  // priorHistory — if we saved first and fetched after, the new message
  // would appear as the last row of its own "history", and the classifier
  // would always see it there and misclassify the context (e.g. a plain
  // contract question would look like it's already part of the discussed
  // history). See lib/openai/chat.ts's getChatCompletion for how
  // priorHistory is then sliced per context type (10 turns for
  // CONTRACT/BOTH, 20 for HISTORY).
  const { data: priorHistoryRows } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(MAX_CHAT_HISTORY)

  const priorHistory = (priorHistoryRows ?? []).map((row) => ({
    role: row.role as 'user' | 'assistant',
    content: row.content as string,
  }))

  const { error: userInsertError } = await supabase.from('chat_messages').insert({
    session_id: sessionId,
    user_id: user.id,
    role: 'user',
    content: parsed.data.message,
  })

  if (userInsertError) {
    return errorResponse('INTERNAL_ERROR', 'Could not save your message.', 500)
  }

  try {
    const { content, pageCitation, contextSource } = await getChatCompletion(
      contract.contract_text,
      priorHistory,
      parsed.data.message
    )

    const { data: assistantMessage, error: assistantInsertError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        role: 'assistant',
        content,
        page_citation: pageCitation,
        context_source: contextSource,
      })
      .select('*')
      .single()

    if (assistantInsertError || !assistantMessage) {
      throw new Error('Could not save the response.')
    }

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('[contracts/chat] completion failed', { contractId: contract.id, error })
    return errorResponse(
      'UPSTREAM_ERROR',
      'We could not get a response right now. Please try again.',
      502
    )
  }
}
