import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { SignUpForm } from '@/components/auth/sign-up-form'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-display text-2xl italic text-ink-900">Get started free</h1>
          <p className="mt-2 text-sm text-ink-700">Know what you&apos;re signing, in minutes.</p>
        </div>
        <div className="mt-6">
          <SignUpForm />
        </div>
        <p className="mt-6 text-center text-sm text-ink-700">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-indigo-500">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  )
}
