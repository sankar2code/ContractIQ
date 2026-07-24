import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/security/authGuard'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractContractText } from '@/lib/pdf/extract-text'
import { uploadRequestSchema } from '@/lib/validation/contracts'
import { validateFileUpload } from '@/lib/security/inputValidator'
import { checkRateLimit } from '@/lib/security/rateLimiter'
import {
  MAX_FILE_SIZE_BYTES,
  MAX_PAGE_COUNT,
  MAX_ESTIMATED_TOKENS,
  MIN_WORD_COUNT,
} from '@/lib/security/tokenLimiter'
import { errorResponse } from '@/lib/errors'

export const runtime = 'nodejs'

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\- ]/g, '').trim() || 'contract.pdf'
}

// POST /api/contracts/upload — PDF upload + server-side text extraction.
// See docs/specs/02-contract-upload-and-preprocessing.md.
export async function POST(request: Request) {
  const auth = await requireAuth()
  if ('response' in auth) return auth.response
  const { user } = auth

  const rateLimit = await checkRateLimit(user.id, 'contract_upload')
  if (!rateLimit.allowed) {
    return errorResponse(
      'RATE_LIMITED',
      'Upload limit reached for today — please try again tomorrow.',
      429,
      { 'Retry-After': String(rateLimit.retryAfterSeconds) }
    )
  }

  const formData = await request.formData().catch(() => null)
  if (!formData) {
    return errorResponse('VALIDATION_ERROR', 'Invalid upload request.', 400)
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return errorResponse('VALIDATION_ERROR', 'No file was provided.', 400)
  }

  const parsedType = uploadRequestSchema.safeParse({
    contract_type: formData.get('contract_type'),
  })
  if (!parsedType.success) {
    return errorResponse('VALIDATION_ERROR', 'Select a contract type (NDA or MSA).', 400)
  }

  // Three-step file validation (extension -> MIME type -> size) — extension
  // and MIME type are both client-supplied and spoofable, so this is
  // defense-in-depth ahead of pdf-parse's own parse-or-reject step below,
  // which is the real content-level guarantee.
  const fileValidation = validateFileUpload(file, MAX_FILE_SIZE_BYTES)
  if (!fileValidation.valid) {
    return errorResponse('VALIDATION_ERROR', fileValidation.error ?? 'Invalid file.', 400)
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let extracted: { text: string; pageCount: number }
  try {
    extracted = await extractContractText(buffer)
  } catch {
    return errorResponse(
      'INTERNAL_ERROR',
      "That file didn't parse. Try a text-based PDF (not a scanned image).",
      500
    )
  }

  if (extracted.pageCount > MAX_PAGE_COUNT) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Contracts over 20 pages are not supported yet.',
      422
    )
  }

  const wordCount = extracted.text.split(/\s+/).filter(Boolean).length
  if (wordCount < MIN_WORD_COUNT) {
    return errorResponse('SCANNED_PDF', 'Scanned PDFs are not supported yet.', 422)
  }

  const estimatedTokens = Math.ceil(extracted.text.length / 4)
  if (estimatedTokens > MAX_ESTIMATED_TOKENS) {
    return errorResponse(
      'VALIDATION_ERROR',
      'This contract is too long for MVP (15,000 token limit).',
      422
    )
  }

  const contractId = crypto.randomUUID()
  const fileName = sanitizeFileName(file.name)

  // Storage upload is non-blocking: a failure here only disables the PDF
  // viewer later (text-viewer fallback is used instead) — it must never
  // block the contract from being created, per engineering-doc §7.
  let filePath: string | null = null
  try {
    const admin = createAdminClient()
    const storagePath = `${user.id}/${contractId}/${fileName}`
    const { error: uploadError } = await admin.storage
      .from('contracts')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false })
    if (!uploadError) {
      filePath = storagePath
    }
  } catch {
    filePath = null
  }

  const supabase = createClient()
  const { error: insertError } = await supabase.from('contracts').insert({
    id: contractId,
    user_id: user.id,
    contract_type: parsedType.data.contract_type,
    file_name: fileName,
    file_path: filePath,
    contract_text: extracted.text,
    page_count: extracted.pageCount,
    status: 'uploaded',
  })

  if (insertError) {
    return errorResponse('INTERNAL_ERROR', 'Could not save the contract. Please try again.', 500)
  }

  return NextResponse.json(
    { contract_id: contractId, page_count: extracted.pageCount, status: 'uploaded' },
    { status: 201 }
  )
}
