'use client'

import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PdfViewerProps {
  signedUrl: string
  targetPage: number | null
  onLoadError: () => void
}

export function PdfViewer({ signedUrl, targetPage, onLoadError }: PdfViewerProps) {
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [scale, setScale] = useState(1.1)
  const [numPages, setNumPages] = useState(0)

  useEffect(() => {
    let cancelled = false
    const loadingTask = pdfjsLib.getDocument(signedUrl)

    loadingTask.promise
      .then((pdf) => {
        if (cancelled) return
        setDoc(pdf)
        setNumPages(pdf.numPages)
      })
      .catch(() => {
        if (!cancelled) onLoadError()
      })

    return () => {
      cancelled = true
      loadingTask.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedUrl])

  useEffect(() => {
    if (!targetPage) return
    const target = pageRefs.current.get(targetPage)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [targetPage])

  if (!doc) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border border-ink-100 bg-paper-white">
        <p className="text-sm text-ink-500">Loading PDF…</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-ink-100 bg-paper-white">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2">
        <span className="text-xs text-ink-500">{numPages} pages</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.1).toFixed(2))))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setScale((s) => Math.min(2, Number((s + 0.1).toFixed(2))))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center gap-6">
          {Array.from({ length: numPages }, (_, index) => index + 1).map((pageNumber) => (
            <PdfPageCanvas
              key={pageNumber}
              doc={doc}
              pageNumber={pageNumber}
              scale={scale}
              isTarget={pageNumber === targetPage}
              registerRef={(el) => {
                if (el) pageRefs.current.set(pageNumber, el)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface PdfPageCanvasProps {
  doc: PDFDocumentProxy
  pageNumber: number
  scale: number
  isTarget: boolean
  registerRef: (el: HTMLDivElement | null) => void
}

// Renders a single page lazily — the canvas only draws once the page
// scrolls near the viewport, mitigating large-file rendering cost per
// engineering-doc §10 (Component E risk mitigation).
function PdfPageCanvas({ doc, pageNumber, scale, isTarget, registerRef }: PdfPageCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = wrapperRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || !canvasRef.current) return
    let cancelled = false
    let renderTask: { cancel: () => void } | null = null

    doc.getPage(pageNumber).then((page) => {
      if (cancelled || !canvasRef.current) return
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      const task = page.render({ canvasContext: context, viewport })
      renderTask = task
      task.promise.catch(() => {})
    })

    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [doc, pageNumber, scale, isVisible])

  return (
    <div
      ref={(el) => {
        wrapperRef.current = el
        registerRef(el)
      }}
      id={`pdf-page-${pageNumber}`}
      className={cn(
        'relative rounded-doc shadow-sm transition-shadow',
        isTarget && 'ring-2 ring-indigo-500'
      )}
    >
      <canvas ref={canvasRef} className="block max-w-full" />
      {!isVisible ? (
        <div className="flex h-[400px] w-[300px] items-center justify-center bg-ink-50 text-xs text-ink-500">
          Page {pageNumber}
        </div>
      ) : null}
    </div>
  )
}
