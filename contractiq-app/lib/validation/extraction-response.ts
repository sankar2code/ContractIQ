import { z } from 'zod'

export const extractedTermSchema = z.object({
  term_name: z.string().min(1),
  value: z.string().min(1),
  page_number: z.number().int(),
  confidence_score: z.number().min(0).max(1),
  source_sentence: z.string().min(1),
})

// OpenAI JSON mode requires a top-level JSON *object*, not a bare array —
// hence the { "terms": [...] } wrapper, per docs/specs/03-key-term-extraction.md.
export const extractionResponseSchema = z.object({
  terms: z.array(extractedTermSchema),
})

export type ExtractedTerm = z.infer<typeof extractedTermSchema>
