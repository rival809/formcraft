import { Injectable, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

interface SendMailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: process.env.SMTP_PORT === '465',
      auth:
        process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    })
  }

  async send(options: SendMailOptions) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'noreply@formcraft.local',
        ...options,
      })
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}`, err)
    }
  }

  async sendNewResponseNotification({
    ownerEmail,
    formTitle,
    responseId,
    appUrl,
  }: {
    ownerEmail: string
    formTitle: string
    responseId: string
    appUrl: string
  }) {
    await this.send({
      to: ownerEmail,
      subject: `New response for "${formTitle}"`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#1e293b">New form response received</h2>
          <p>Your form <strong>${formTitle}</strong> just received a new response.</p>
          <a href="${appUrl}/forms/${responseId}/responses"
             style="display:inline-block;margin-top:16px;padding:10px 20px;background:#3b82f6;color:#fff;border-radius:6px;text-decoration:none">
            View Response
          </a>
          <p style="margin-top:24px;color:#64748b;font-size:12px">FormCraft · Self-hosted form builder</p>
        </div>
      `,
    })
  }

  async sendAutoReply({
    to,
    formTitle,
    successMessage,
  }: {
    to: string
    formTitle: string
    successMessage: string
  }) {
    await this.send({
      to,
      subject: `Thanks for your response — ${formTitle}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#1e293b">${formTitle}</h2>
          <p>${successMessage}</p>
          <p style="margin-top:24px;color:#64748b;font-size:12px">FormCraft · Self-hosted form builder</p>
        </div>
      `,
    })
  }
}
