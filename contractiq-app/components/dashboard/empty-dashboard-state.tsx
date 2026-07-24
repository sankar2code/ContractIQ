import Link from 'next/link'
import { FileSearch } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function EmptyDashboardState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-ink-300 bg-paper-white px-6 py-16 text-center">
      <FileSearch className="h-8 w-8 text-indigo-500" strokeWidth={1.5} />
      <p className="mt-4 text-sm font-medium text-ink-900">
        No contracts reviewed yet — upload your first contract to begin
      </p>
      <Link
        href="/contracts/upload"
        className={cn(buttonVariants({ variant: 'primary' }), 'mt-5')}
      >
        Review a contract
      </Link>
    </div>
  )
}
