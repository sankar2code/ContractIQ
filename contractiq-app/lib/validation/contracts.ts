import { z } from 'zod'
import {
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_CUSTOM_TERM_LENGTH,
  MAX_CUSTOM_TERMS_PER_CONTRACT,
  MAX_FEEDBACK_COMMENT_LENGTH,
} from '@/lib/security/tokenLimiter'

export const contractTypeSchema = z.enum(['nda', 'msa'])

export const uploadRequestSchema = z.object({
  contract_type: contractTypeSchema,
})

export const customTermsRequestSchema = z.object({
  terms: z
    .array(z.string().trim().min(1).max(MAX_CUSTOM_TERM_LENGTH))
    .min(1)
    .max(MAX_CUSTOM_TERMS_PER_CONTRACT),
})

export const keyTermUpdateSchema = z.object({
  value: z.string().trim().min(1).max(2000),
})

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
})

export const feedbackSchema = z.object({
  rating: z.enum(['up', 'down']),
  comment: z.string().trim().max(MAX_FEEDBACK_COMMENT_LENGTH).optional(),
})

export const contractsListQuerySchema = z.object({
  sort: z.enum(['date', 'name', 'type']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),
})
