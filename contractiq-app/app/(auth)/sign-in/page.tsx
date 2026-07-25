import { Suspense } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { SignInForm } from '@/components/auth/sign-in-form'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-paper px-6">
      <ThemeToggle className="absolute right-6 top-6" />
      <Card className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-display text-2xl italic text-ink-900">Sign in</h1>
          <p className="mt-2 text-sm text-ink-700">Welcome back — review your contracts.</p>
        </div>
        <div className="mt-6">
          <Suspense fallback={null}>
            <SignInForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-ink-700">
          New to ContractIQ?{' '}
          <Link href="/sign-up" className="font-medium text-indigo-500">
            Get started free
          </Link>
        </p>
      </Card>
    </main>
  )
}
