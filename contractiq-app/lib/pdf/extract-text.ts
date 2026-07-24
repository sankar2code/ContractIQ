import pdfParse from 'pdf-parse'

export interface ExtractedContract {
  text: string
  pageCount: number
}

interface PdfPageProxyLike {
  getTextContent: () => Promise<{ items: Array<{ str?: string }> }>
}

// Extracts contract text once, inserting a `[PAGE N]` marker before each
// page's content, per docs/specs/02-contract-upload-and-preprocessing.md.
// pdf-parse's pagerender hook gives us per-page text; we build the marked-up
// string ourselves instead of relying on pdf-parse's own concatenation.
export async function extractContractText(buffer: Buffer): Promise<ExtractedContract> {
  const pages: string[] = []

  const data = await pdfParse(buffer, {
    pagerender: async (pageData: PdfPageProxyLike) => {
      const textContent = await pageData.getTextContent()
      const pageText = textContent.items.map((item) => item.str ?? '').join(' ')
      pages.push(pageText)
      return pageText
    },
  })

  const text = pages
    .map((pageText, index) => `[PAGE ${index + 1}]\n${pageText.trim()}`)
    .join('\n\n')

  return { text, pageCount: data.numpages }
}
