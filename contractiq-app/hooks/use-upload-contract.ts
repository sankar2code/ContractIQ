'use client'

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ContractType } from '@/types/contract'

export type UploadStep = 'idle' | 'uploading' | 'extracting-ai' | 'done' | 'error'

interface UploadContractInput {
  file: File
  contractType: ContractType
  customTerms: string[]
}

async function parseJsonError(response: Response) {
  const body = await response.json().catch(() => null)
  return (body?.error?.message as string | undefined) ?? 'Something went wrong. Please try again.'
}

export function useUploadContract() {
  const [step, setStep] = useState<UploadStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const upload = useCallback(
    async ({ file, contractType, customTerms }: UploadContractInput): Promise<string | null> => {
      setError(null)
      setStep('uploading')

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('contract_type', contractType)

        const uploadResponse = await fetch('/api/contracts/upload', {
          method: 'POST',
          body: formData,
        })
        if (!uploadResponse.ok) throw new Error(await parseJsonError(uploadResponse))
        const { contract_id: contractId } = (await uploadResponse.json()) as {
          contract_id: string
        }

        if (customTerms.length > 0) {
          const customTermsResponse = await fetch(
            `/api/contracts/${contractId}/custom-terms`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ terms: customTerms }),
            }
          )
          if (!customTermsResponse.ok) throw new Error(await parseJsonError(customTermsResponse))
        }

        setStep('extracting-ai')
        const processResponse = await fetch(`/api/contracts/${contractId}/process`, {
          method: 'POST',
        })
        if (!processResponse.ok) throw new Error(await parseJsonError(processResponse))

        setStep('done')
        queryClient.invalidateQueries({ queryKey: ['contracts'] })
        return contractId
      } catch (err) {
        setStep('error')
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        return null
      }
    },
    [queryClient]
  )

  const reset = useCallback(() => {
    setStep('idle')
    setError(null)
  }, [])

  return { upload, step, error, reset }
}
