'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const result = signInSchema.safeParse({ email, password })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please check your details and try again.')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword(result.data)
    setIsSubmitting(false)

    if (signInError) {
      setError('Invalid email or password.')
      return
    }

    const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? (
        <p role="alert" aria-live="polite" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
