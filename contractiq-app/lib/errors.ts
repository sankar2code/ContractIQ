import { NextResponse } from 'next/server'

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'INTERNAL_ERROR'
  | 'ALREADY_PROCESSING'
  | 'SCANNED_PDF'
  | 'PROMPT_INJECTION'

// Uniform error envelope, per docs/engineering/engineering-doc.md §9.
export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  headers?: HeadersInit
) {
  return NextResponse.json({ error: { code, message } }, { status, headers })
}
