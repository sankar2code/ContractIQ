'use client'

import { useQuery } from '@tanstack/react-query'

interface SignedUrlResponse {
  signed_url: string | null
  expires_at: string | null
}

async function fetchSignedUrl(contractId: string): Promise<SignedUrlResponse> {
  const response = await fetch(`/api/contracts/${contractId}/signed-url`)
  if (!response.ok) {
    return { signed_url: null, expires_at: null }
  }
  return response.json()
}

// staleTime is kept just under the 1-hour signed URL expiry so a refetch is
// only triggered near expiry or on an explicit PdfViewer load-error refetch()
// call, per docs/specs/04-results-display.md.
export function useSignedUrl(contractId: string, initialUrl: string | null) {
  return useQuery({
    queryKey: ['signed-url', contractId],
    queryFn: () => fetchSignedUrl(contractId),
    initialData: initialUrl ? { signed_url: initialUrl, expires_at: null } : undefined,
    staleTime: 50 * 60 * 1000,
    enabled: Boolean(initialUrl),
  })
}
