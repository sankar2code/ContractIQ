const fs = require('fs')
const path = require('path')

// pdfjs-dist ships its worker as a separate build artifact that must be
// served as a static asset — copied into public/ so PdfViewer can point
// GlobalWorkerOptions.workerSrc at a same-origin file instead of a CDN.
const source = path.join(
  __dirname,
  '..',
  'node_modules',
  'pdfjs-dist',
  'build',
  'pdf.worker.min.mjs'
)
const destDir = path.join(__dirname, '..', 'public')
const dest = path.join(destDir, 'pdf.worker.min.mjs')

if (!fs.existsSync(source)) {
  console.warn('[copy-pdf-worker] pdfjs-dist worker not found at', source)
  process.exit(0)
}

fs.mkdirSync(destDir, { recursive: true })
fs.copyFileSync(source, dest)
console.log('[copy-pdf-worker] copied pdf.worker.min.mjs to public/')
