'use client'

import { useToastStore, type ToastItem } from '@/lib/stores/toast-store'

const AUTO_DISMISS_MS = 5000

export function useToast() {
  const addToast = useToastStore((state) => state.addToast)
  const removeToast = useToastStore((state) => state.removeToast)

  function toast(input: Omit<ToastItem, 'id'>) {
    const id = addToast(input)
    setTimeout(() => removeToast(id), AUTO_DISMISS_MS)
    return id
  }

  return { toast, dismiss: removeToast }
}
