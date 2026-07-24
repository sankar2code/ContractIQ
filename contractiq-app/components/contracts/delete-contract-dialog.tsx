'use client'

import { useState, type ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteContractDialogProps {
  contractName: string
  onConfirm: () => Promise<void>
  trigger?: ReactNode
}

export function DeleteContractDialog({
  contractName,
  onConfirm,
  trigger,
}: DeleteContractDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleConfirm() {
    setIsDeleting(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="ghost" size="sm" aria-label="Delete contract">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{contractName}&rdquo;?</DialogTitle>
          <DialogDescription>
            This permanently removes the contract, its extracted terms, chat history, and
            feedback. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete contract'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
