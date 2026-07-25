import Link from 'next/link'
import { Gauge, MapPin, ListPlus, MessageSquareText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    icon: MapPin,
    title: 'Page-level attribution',
    description:
      'Every extracted term links straight back to the sentence and page it came from — no more hunting through 20 pages to verify a number.',
  },
  {
    icon: Gauge,
    title: 'Confidence scoring',
    description:
      'Each term ships with a 0–100% confidence score. Low-confidence terms are flagged, never hidden, so you know exactly what to double-check.',
  },
  {
    icon: ListPlus,
    title: 'Custom key terms',
    description:
      'Add up to 5 terms specific to your deal — a non-compete radius, a renewal notice window — before processing begins.',
  },
  {
    icon: MessageSquareText,
    title: 'Grounded chat',
    description:
      'Ask plain-English questions and get answers sourced only from your document, with a page citation on every response.',
  },
] as const

const STEPS = [
  {
    number: '01',
    title: 'Upload',
    description: 'Drop in an NDA or MSA — text-based PDF, up to 20 pages.',
  },
  {
    number: '02',
    title: 'Extract',
    description: 'GPT-4o reads the contract and extracts the terms that matter for its type.',
  },
  {
    number: '03',
    title: 'Review',
    description: 'See values, pages, and confidence side by side with the source document.',
  },
] as const

export default function MarketingPage() {
  return (
    <main className="bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-8">
        <span className="font-display text-xl italic text-ink-900">ContractIQ</span>
        <nav className="flex items-center gap-3">
          <Link href="/sign-in" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            Sign In
          </Link>
          <Link href="/sign-up" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
            Get Started Free
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:px-8 sm:py-28">
        <span className="inline-block rounded-pill bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
          AI-assisted contract review
        </span>
        <h1 className="mt-6 font-display text-4xl italic leading-tight text-ink-900 sm:text-5xl">
          Know what you&apos;re signing — in under 15 minutes.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-700">
          Upload a contract. See what it says, where, and how sure we are — in under 30 seconds.
          Built for NDAs and MSAs, for people without a lawyer on call.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/sign-up" className={cn(buttonVariants({ variant: 'primary' }))}>
            Get Started Free
          </Link>
          <Link href="/sign-in" className={cn(buttonVariants({ variant: 'ghost' }))}>
            Sign In
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="text-left">
              <feature.icon className="h-6 w-6 text-indigo-500" strokeWidth={1.5} />
              <h3 className="mt-4 text-base font-semibold text-ink-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 sm:px-8">
        <h2 className="text-center text-2xl font-semibold text-ink-900">How it works</h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="text-center">
              <span className="font-mono text-sm font-medium text-indigo-500">{step.number}</span>
              <h3 className="mt-2 text-base font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink-100">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
          <p className="text-sm text-ink-500">
            This is an AI-assisted review tool, not legal advice. Always verify critical terms
            with a qualified lawyer.
          </p>
          <p className="mt-2 text-xs text-ink-500">
            Powered by OpenAI GPT-4o · © {new Date().getFullYear().toString()} ContractIQ
          </p>
        </div>
      </footer>
    </main>
  )
}
