import { ShieldAlert } from 'lucide-react'

export function Disclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
      <p>
        This is an AI-assisted review tool, not legal advice. Always verify critical terms with a
        qualified lawyer.
      </p>
    </div>
  )
}
