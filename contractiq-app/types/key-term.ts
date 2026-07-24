export interface KeyTerm {
  id: string
  contract_id: string
  user_id: string
  term_name: string
  value: string
  page_number: number
  confidence_score: number
  source_sentence: string
  is_custom: boolean
  edited: boolean
  original_ai_value: string | null
  created_at: string
  updated_at: string
}

export interface CustomKeyTerm {
  id: string
  contract_id: string
  user_id: string
  term_name: string
  created_at: string
}
