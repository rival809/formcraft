import { z } from 'zod'

export const CreateWebhookSchema = z.object({
  formId: z.string().cuid(),
  url: z.string().url(),
  secret: z.string().min(8).optional(),
  description: z.string().optional(),
  events: z.array(z.enum(['RESPONSE_CREATED'])).min(1),
})

export const WebhookPayload = z.object({
  event: z.literal('RESPONSE_CREATED'),
  formId: z.string(),
  responseId: z.string(),
  data: z.record(z.string(), z.unknown()),
  submittedAt: z.string().datetime(),
})

export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>
export type WebhookPayload = z.infer<typeof WebhookPayload>
