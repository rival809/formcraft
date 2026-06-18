import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import type { Queue } from 'bullmq'
import { prisma } from '@formcraft/db'
import type { SubmitResponseInput, FormSettings } from '@formcraft/types'
import { MailService } from '../mail/mail.service.js'

@Injectable()
export class ResponsesService {
  constructor(
    @InjectQueue('webhooks') private webhookQueue: Queue,
    private readonly mail: MailService,
  ) {}

  async submit(input: SubmitResponseInput, ip?: string) {
    const form = await prisma.form.findUnique({
      where: { id: input.formId },
      include: {
        webhooks: { where: { active: true, events: { has: 'RESPONSE_CREATED' } } },
        workspace: { include: { members: { where: { role: { in: ['OWNER', 'ADMIN'] } }, include: { user: { select: { email: true } } } } } },
      },
    })

    if (!form) throw new NotFoundException('Form not found')
    if (form.status !== 'PUBLISHED') throw new BadRequestException('Form is not accepting responses')

    const settings = form.settings as FormSettings | null

    const response = await prisma.formResponse.create({
      data: {
        formId: input.formId,
        data: input.data as never,
        meta: { ip, ...input.meta } as never,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Webhook deliveries (async via BullMQ)
    for (const webhook of form.webhooks) {
      await this.webhookQueue.add(
        'deliver',
        {
          webhookId: webhook.id,
          url: webhook.url,
          secretHash: webhook.secretHash,
          payload: {
            event: 'RESPONSE_CREATED',
            formId: form.id,
            responseId: response.id,
            data: input.data,
            submittedAt: response.createdAt.toISOString(),
          },
        },
        { attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
      )
    }

    // Notify workspace owners/admins
    if (settings?.notifyOwnerOnSubmit !== false) {
      for (const member of form.workspace.members) {
        await this.mail.sendNewResponseNotification({
          ownerEmail: member.user.email,
          formTitle: form.title,
          responseId: form.id,
          appUrl,
        })
      }
    }

    // Auto-reply to respondent if configured
    if (settings?.sendConfirmationEmail && settings.confirmationEmailFieldId) {
      const respondentEmail = input.data[settings.confirmationEmailFieldId]
      if (typeof respondentEmail === 'string' && respondentEmail.includes('@')) {
        await this.mail.sendAutoReply({
          to: respondentEmail,
          formTitle: form.title,
          successMessage: settings.successMessage ?? 'Thank you for your response!',
        })
      }
    }

    return { id: response.id }
  }

  async findAll(
    { formId, page, limit }: { formId: string; page: number; limit: number },
    _userId: string,
  ) {
    const [responses, total] = await Promise.all([
      prisma.formResponse.findMany({
        where: { formId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.formResponse.count({ where: { formId } }),
    ])
    return { data: responses, total, page, limit }
  }

  async exportCsv(formId: string, _userId: string) {
    const [form, responses] = await Promise.all([
      prisma.form.findUnique({ where: { id: formId }, select: { fields: true } }),
      prisma.formResponse.findMany({ where: { formId }, orderBy: { createdAt: 'desc' } }),
    ])
    if (!form) throw new Error('Form not found')

    const fields = (form.fields as Array<{ id: string; label: string }>) ?? []
    const headers = ['submittedAt', ...fields.map((f) => f.label)]

    const rows = responses.map((r) => {
      const data = r.data as Record<string, unknown>
      return [
        r.createdAt.toISOString(),
        ...fields.map((f) => {
          const val = data[f.id]
          return Array.isArray(val) ? val.join(', ') : String(val ?? '')
        }),
      ]
    })

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
    return { csv, filename: `responses-${formId}.csv` }
  }

  async delete(id: string, _userId: string) {
    await prisma.formResponse.delete({ where: { id } })
    return { success: true }
  }
}
