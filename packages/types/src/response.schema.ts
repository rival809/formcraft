import { z } from 'zod'

export const ResponseMeta = z.object({
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  durationMs: z.number().optional(),
})

export const SubmitResponseSchema = z.object({
  formId: z.string().cuid(),
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()])),
  meta: ResponseMeta.optional(),
})

export type SubmitResponseInput = z.infer<typeof SubmitResponseSchema>
export type ResponseMeta = z.infer<typeof ResponseMeta>
