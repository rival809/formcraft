import { Processor, WorkerHost } from '@nestjs/bullmq'
import type { Job } from 'bullmq'
import { prisma } from '@formcraft/db'
import type { WebhookPayload } from '@formcraft/types'
import { createHmac } from 'crypto'

interface WebhookJobData {
  webhookId: string
  url: string
  secretHash: string | null
  payload: WebhookPayload
}

@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {
  async process(job: Job<WebhookJobData>) {
    const { webhookId, url, secretHash, payload } = job.data
    const body = JSON.stringify(payload)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'FormCraft-Webhook/1.0',
      'X-FormCraft-Event': payload.event,
    }

    if (secretHash) {
      const signature = createHmac('sha256', secretHash).update(body).digest('hex')
      headers['X-FormCraft-Signature'] = `sha256=${signature}`
    }

    const res = await fetch(url, { method: 'POST', headers, body })

    if (!res.ok) {
      await prisma.webhook.update({
        where: { id: webhookId },
        data: { failureCount: { increment: 1 } },
      })
      throw new Error(`Webhook delivery failed: ${res.status}`)
    }

    await prisma.webhook.update({
      where: { id: webhookId },
      data: { lastDeliveredAt: new Date(), failureCount: 0 },
    })
  }
}
