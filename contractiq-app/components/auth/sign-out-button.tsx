'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSignOut() {
    setIsSubmitting(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsSubmitting(false)
    router.push('/')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isSubmitting}>
      <LogOut className="h-4 w-4" strokeWidth={1.5} />
      Sign out
    </Button>
  )
}
