export type ContractType = 'nda' | 'msa'
export type ContractStatus = 'uploaded' | 'processing' | 'completed' | 'error'

export interface Contract {
  id: string
  user_id: string
  contract_type: ContractType
  file_name: string
  file_path: string | null
  contract_text: string
  page_count: number
  status: ContractStatus
  last_accessed_at: string
  created_at: string
  updated_at: string
}

export interface ContractSummary {
  id: string
  contract_type: ContractType
  file_name: string
  status: ContractStatus
  created_at: string
}
