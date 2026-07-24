'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useContract } from '@/hooks/use-contract'
import { useSignedUrl } from '@/hooks/use-signed-url'
import { useUpdateKeyTerm } from '@/hooks/use-update-key-term'
import { useDeleteContract } from '@/hooks/use-delete-contract'
import { PdfViewer } from '@/components/contracts/pdf-viewer'
import { TextViewerFallback } from '@/components/contracts/text-viewer-fallback'
import { KeyTermsPanel } from '@/components/contracts/key-terms-panel'
import { Disclaimer } from '@/components/contracts/disclaimer'
import { DeleteContractDialog } from '@/components/contracts/delete-contract-dialog'
import { ChatPanel } from '@/components/chat/chat-panel'
import { FeedbackWidget } from '@/components/feedback/feedback-widget'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

export default function ContractResultsPage() {
  const params = useParams<{ contractId: string }>()
  const contractId = params.contractId
  const router = useRouter()
  const { data, isLoading, isError, error } = useContract(contractId)
  const { data: signedUrlData } = useSignedUrl(contractId, data?.signed_url ?? null)
  const updateKeyTerm = useUpdateKeyTerm(contractId)
  const deleteContract = useDeleteContract()
  const { toast } = useToast()
  const [targetPage, setTargetPage] = useState<number | null>(null)
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false)

  async function handleDelete() {
    try {
      await deleteContract.mutateAsync(contractId)
      toast({ title: 'Contract deleted.', variant: 'success' })
      router.push('/dashboard')
    } catch (err) {
      toast({
        title: "Couldn't delete this contract",
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  async function handleEdit(termId: string, value: string) {
    try {
      await updateKeyTerm.mutateAsync({ termId, value })
    } catch (err) {
      toast({
        title: "Couldn't save your edit",
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-ink-500">Loading contract…</p>
      </main>
    )
  }

  if (isError || !data) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-red-500">
          {error instanceof Error ? error.message : 'This contract is no longer available.'}
        </p>
      </main>
    )
  }

  const { contract, key_terms: keyTerms } = data
  const signedUrl = pdfLoadFailed ? null : (signedUrlData?.signed_url ?? null)

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{contract.file_name}</h1>
          <p className="text-xs uppercase tracking-wide text-ink-500">
            {contract.contract_type} · {contract.page_count} pages
          </p>
        </div>
        <DeleteContractDialog
          contractName={contract.file_name}
          onConfirm={handleDelete}
          trigger={
            <Button type="button" variant="ghost" size="sm">
              Delete
            </Button>
          }
        />
      </div>

      <div className="mb-6">
        <Disclaimer />
      </div>

      {contract.status === 'processing' ? (
        <div className="rounded-lg border border-ink-100 bg-paper-white p-6 text-sm text-ink-700">
          Still analysing this contract — refresh in a few seconds.
        </div>
      ) : contract.status === 'error' ? (
        <ContractErrorState contractId={contractId} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-[70vh]">
            {signedUrl ? (
              <PdfViewer
                signedUrl={signedUrl}
                targetPage={targetPage}
                onLoadError={() => setPdfLoadFailed(true)}
              />
            ) : (
              <TextViewerFallback contractText={contract.contract_text} targetPage={targetPage} />
            )}
          </div>
          <div className="h-[70vh]">
            <Tabs defaultValue="key-terms" className="flex h-full flex-col">
              <TabsList className="self-start">
                <TabsTrigger value="key-terms">Key terms</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
              </TabsList>
              <TabsContent value="key-terms" className="mt-3 flex-1 overflow-y-auto">
                <KeyTermsPanel terms={keyTerms} onPageClick={setTargetPage} onEdit={handleEdit} />
              </TabsContent>
              <TabsContent value="chat" className="mt-3 flex-1 overflow-hidden">
                <ChatPanel contractId={contractId} onCitationClick={setTargetPage} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {contract.status === 'completed' ? (
        <div className="mt-6">
          <FeedbackWidget contractId={contractId} />
        </div>
      ) : null}
    </main>
  )
}

function ContractErrorState({ contractId }: { contractId: string }) {
  const [isRetrying, setIsRetrying] = useState(false)
  const { toast } = useToast()

  async function handleRetry() {
    setIsRetrying(true)
    try {
      const response = await fetch(`/api/contracts/${contractId}/process`, { method: 'POST' })
      if (!response.ok) throw new Error('Retry failed')
      window.location.reload()
    } catch {
      toast({
        title: 'Retry failed',
        description: 'Please try again in a few minutes.',
        variant: 'destructive',
      })
      setIsRetrying(false)
    }
  }

  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-sm text-red-900">
      <p>We couldn&apos;t analyse this contract.</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleRetry}
        disabled={isRetrying}
        className="mt-3 border-red-200"
      >
        {isRetrying ? 'Retrying…' : 'Retry processing'}
      </Button>
    </div>
  )
}
