const BLOCKED_EXTENSIONS = [
  '.exe',
  '.js',
  '.mjs',
  '.cjs',
  '.php',
  '.zip',
  '.sh',
  '.bat',
  '.cmd',
  '.py',
  '.rb',
  '.ps1',
]

// ContractIQ is PDF-only per the PRD — pdf-parse (lib/pdf/extract-text.ts)
// is the only extraction pipeline implemented; there is no .docx parser, so
// unlike the generic template this does not allow .docx.
const ALLOWED_EXTENSIONS = ['.pdf']
const ALLOWED_MIME_TYPES = ['application/pdf']

export interface FileValidationResult {
  valid: boolean
  error?: string
}

function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot === -1 ? '' : fileName.slice(lastDot).toLowerCase()
}

// Three-step validation, in order: extension -> MIME type -> size.
// Extension and MIME type are both client-supplied and independently
// spoofable (a crafted multipart request can set either to anything), so
// neither is trusted alone — pdf-parse's parse-or-reject step downstream
// (lib/pdf/extract-text.ts, called from the upload route after this
// passes) is the real content-level guarantee that the bytes are actually
// a valid PDF.
export function validateFileUpload(file: File, maxSizeBytes: number): FileValidationResult {
  const extension = getExtension(file.name)

  if (BLOCKED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'This file type is not allowed.' }
  }

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Only PDF files are supported.' }
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PDF files are supported.' }
  }

  if (file.size > maxSizeBytes) {
    return { valid: false, error: 'File exceeds the 10 MB limit.' }
  }

  return { valid: true }
}

// Re-exports the canonical Zod request schemas — lib/validation/contracts.ts
// remains their single source of truth; this file adds the file validator
// alongside them without duplicating any schema logic.
export * from '@/lib/validation/contracts'
