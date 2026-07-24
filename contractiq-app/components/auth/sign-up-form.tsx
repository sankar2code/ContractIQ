'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const signUpSchema = z
  .object({
    email: z.string().trim().email('Enter a valid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

export function SignUpForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const result = signUpSchema.safeParse({ email, password, confirmPassword })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Please check your details and try again.')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
    })
    setIsSubmitting(false)

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'An account with this email already exists.'
          : signUpError.message
      )
      return
    }

    router.push('/dashboard')
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
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>
      {error ? (
        <p role="alert" aria-live="polite" className="text-sm text-red-500">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? 'Creating account…' : 'Get started free'}
      </Button>
    </form>
  )
}
