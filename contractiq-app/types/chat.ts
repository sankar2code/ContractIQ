export type ChatRole = 'user' | 'assistant'

// The context type the Conversation Memory Layer classified a question
// into, and therefore which sources the assistant reply was grounded in.
// Null for user-authored rows — only assistant replies carry a source.
export type ChatContextSource = 'contract' | 'history' | 'both'

export interface ChatSession {
  id: string
  contract_id: string
  user_id: string
  created_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  role: ChatRole
  content: string
  page_citation: number | null
  context_source: ChatContextSource | null
  created_at: string
}
