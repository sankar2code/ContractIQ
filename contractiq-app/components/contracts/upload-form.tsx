'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { KeyTermPreviewList } from './key-term-preview-list'
import { CustomTermInput } from './custom-term-input'
import { UploadProgress } from './upload-progress'
import { useUploadContract } from '@/hooks/use-upload-contract'
import type { ContractType } from '@/types/contract'
import { cn } from '@/lib/utils'

const MAX_FILE_BYTES = 10 * 1024 * 1024

export function UploadForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [contractType, setContractType] = useState<ContractType>('nda')
  const [file, setFile] = useState<File | null>(null)
  const [customTerms, setCustomTerms] = useState<string[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { upload, step, error, reset } = useUploadContract()

  function validateAndSetFile(candidate: File | null) {
    if (!candidate) return
    if (candidate.type !== 'application/pdf') {
      setFileError('Only PDF files are supported.')
      return
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setFileError('File exceeds the 10 MB limit.')
      return
    }
    setFileError(null)
    setFile(candidate)
  }

  async function handleProcess() {
    if (!file) {
      setFileError('Choose a PDF to continue.')
      return
    }
    const contractId = await upload({ file, contractType, customTerms })
    if (contractId) {
      router.push(`/contracts/${contractId}`)
    }
  }

  const isBusy = step === 'uploading' || step === 'extracting-ai'

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Label htmlFor="contract-type">Contract type</Label>
        <Select
          value={contractType}
          onValueChange={(value) => setContractType(value as ContractType)}
          disabled={isBusy}
        >
          <SelectTrigger id="contract-type" className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nda">NDA — Non-Disclosure Agreement</SelectItem>
            <SelectItem value="msa">MSA — Master Service Agreement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Contract PDF</Label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setIsDragging(false)
            validateAndSetFile(event.dataTransfer.files[0] ?? null)
          }}
          disabled={isBusy}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-300 bg-paper-white px-6 py-10 text-center transition-colors',
            isDragging && 'border-indigo-500 bg-indigo-50',
            isBusy && 'pointer-events-none opacity-60'
          )}
        >
          <UploadCloud className="h-6 w-6 text-indigo-500" strokeWidth={1.5} />
          <p className="text-sm font-medium text-ink-900">
            {file ? file.name : 'Drag & drop a PDF, or click to browse'}
          </p>
          <p className="text-xs text-ink-500">Up to 10 MB, 20 pages, text-based PDF only</p>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => validateAndSetFile(event.target.files?.[0] ?? null)}
        />
        {fileError ? <p className="text-sm text-red-500">{fileError}</p> : null}
      </div>

      <KeyTermPreviewList contractType={contractType} customTerms={customTerms} />

      <CustomTermInput value={customTerms} onChange={setCustomTerms} max={5} disabled={isBusy} />

      {step === 'error' && error ? (
        <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}{' '}
          <button type="button" onClick={reset} className="font-medium underline">
            Dismiss
          </button>
        </div>
      ) : null}

      {isBusy ? (
        <UploadProgress step={step} />
      ) : (
        <Button onClick={handleProcess} disabled={!file} className="self-start">
          Process contract
        </Button>
      )}
    </div>
  )
}
