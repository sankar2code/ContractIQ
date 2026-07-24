import { create } from 'zustand'
import type { ToastVariant } from '@/components/ui/toast'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastStore {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => string
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    return id
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
