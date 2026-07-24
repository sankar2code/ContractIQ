import { UploadForm } from '@/components/contracts/upload-form'

export default function UploadContractPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink-900">Review a contract</h1>
        <p className="mt-2 text-sm text-ink-700">
          Upload an NDA or MSA — text-based PDF, up to 20 pages — and ContractIQ will extract the
          terms that matter.
        </p>
      </div>
      <UploadForm />
    </main>
  )
}
