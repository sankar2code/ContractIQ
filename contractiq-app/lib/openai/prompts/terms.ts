import type { ContractType } from '@/types/contract'

// Standard key-term schema per contract type, per docs/engineering/engineering-doc.md §8.
// Safe to import client-side (used by the pre-processing preview) — no prompt
// engineering content lives here, only the term names themselves.
export const NDA_STANDARD_TERMS = [
  'Parties',
  'Effective Date',
  'Confidentiality Obligations',
  'Permitted Disclosures',
  'Term & Duration',
  'Governing Law',
  'Jurisdiction',
  'IP Ownership',
  'Non-Solicitation',
  'Breach & Remedy',
] as const

export const MSA_STANDARD_TERMS = [
  'Parties',
  'Service Scope',
  'Payment Terms',
  'Invoice Schedule',
  'Late Payment Penalty',
  'Liability Cap',
  'Indemnification',
  'IP Ownership',
  'Termination Clause',
  'Governing Law',
  'Dispute Resolution',
  'Notice Period',
] as const

export function standardTermsFor(contractType: ContractType): readonly string[] {
  return contractType === 'nda' ? NDA_STANDARD_TERMS : MSA_STANDARD_TERMS
}
