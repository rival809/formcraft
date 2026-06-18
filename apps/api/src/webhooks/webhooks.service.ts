import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { prisma } from '@formcraft/db'
import type { CreateWebhookInput } from '@formcraft/types'
import { createHash } from 'crypto'

@Injectable()
export class WebhooksService {
  async findAll(formId: string, userId: string) {
    await this.assertFormAccess(formId, userId)
    return prisma.webhook.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, formId: true, url: true, events: true,
        active: true, description: true, lastDeliveredAt: true, failureCount: true, createdAt: true,
      },
    })
  }

  async create(input: CreateWebhookInput, userId: string) {
    await this.assertFormAccess(input.formId, userId)
    const secretHash = input.secret
      ? createHash('sha256').update(input.secret).digest('hex')
      : null
    return prisma.webhook.create({
      data: {
        formId: input.formId,
        url: input.url,
        secretHash,
        events: input.events,
        description: input.description,
      },
    })
  }

  async toggle(id: string, userId: string) {
    const webhook = await this.findOneById(id, userId)
    return prisma.webhook.update({
      where: { id: webhook.id },
      data: { active: !webhook.active },
    })
  }

  async delete(id: string, userId: string) {
    await this.findOneById(id, userId)
    await prisma.webhook.delete({ where: { id } })
    return { success: true }
  }

  private async findOneById(id: string, userId: string) {
    const webhook = await prisma.webhook.findUnique({ where: { id } })
    if (!webhook) throw new NotFoundException('Webhook not found')
    await this.assertFormAccess(webhook.formId, userId)
    return webhook
  }

  private async assertFormAccess(formId: string, userId: string) {
    const form = await prisma.form.findUnique({ where: { id: formId }, select: { workspaceId: true } })
    if (!form) throw new NotFoundException('Form not found')
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: form.workspaceId } },
    })
    if (!member) throw new ForbiddenException('Access denied')
    return form
  }
}
