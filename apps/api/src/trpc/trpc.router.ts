import { Injectable, type OnModuleInit } from '@nestjs/common'
import { TrpcService } from './trpc.service.js'
import { FormsService } from '../forms/forms.service.js'
import { ResponsesService } from '../responses/responses.service.js'
import { WorkspacesService } from '../workspaces/workspaces.service.js'
import { WebhooksService } from '../webhooks/webhooks.service.js'
import { ApiKeysService } from '../api-keys/api-keys.service.js'
import { StorageService } from '../storage/storage.service.js'
import { CreateFormSchema, UpdateFormSchema, SubmitResponseSchema, CreateWebhookSchema } from '@formcraft/types'
import { z } from 'zod'

@Injectable()
export class TrpcRouter implements OnModuleInit {
  constructor(
    private readonly trpc: TrpcService,
    private readonly forms: FormsService,
    private readonly responses: ResponsesService,
    private readonly workspaces: WorkspacesService,
    private readonly webhooks: WebhooksService,
    private readonly apiKeys: ApiKeysService,
    private readonly storage: StorageService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appRouter!: any

  onModuleInit() {
    this.appRouter = this.trpc.router({
    // ─── Workspace ────────────────────────────────────────────────────────────
    workspace: this.trpc.router({
      list: this.trpc.protectedProcedure.query(({ ctx }) =>
        this.workspaces.findAllForUser(ctx.userId),
      ),
      create: this.trpc.protectedProcedure
        .input(z.object({ name: z.string().min(1), slug: z.string().min(1).regex(/^[a-z0-9-]+$/) }))
        .mutation(({ input, ctx }) => this.workspaces.create(input, ctx.userId)),
    }),

    // ─── Form ─────────────────────────────────────────────────────────────────
    form: this.trpc.router({
      list: this.trpc.protectedProcedure
        .input(z.object({ workspaceId: z.string().cuid() }))
        .query(({ input, ctx }) => this.forms.findAll(input.workspaceId, ctx.userId)),

      byId: this.trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .query(({ input, ctx }) => this.forms.findOne(input.id, ctx.userId)),

      bySlug: this.trpc.publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(({ input }) => this.forms.findPublicBySlug(input.slug)),

      create: this.trpc.protectedProcedure
        .input(CreateFormSchema)
        .mutation(({ input, ctx }) => this.forms.create(input, ctx.userId)),

      update: this.trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid(), data: UpdateFormSchema }))
        .mutation(({ input, ctx }) => this.forms.update(input.id, input.data, ctx.userId)),

      publish: this.trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => this.forms.publish(input.id, ctx.userId)),

      close: this.trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => this.forms.close(input.id, ctx.userId)),

      delete: this.trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => this.forms.delete(input.id, ctx.userId)),

      duplicate: this.trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => this.forms.duplicate(input.id, ctx.userId)),
    }),

    // ─── Response ─────────────────────────────────────────────────────────────
    response: this.trpc.router({
      submit: this.trpc.publicProcedure
        .input(SubmitResponseSchema)
        .mutation(({ input, ctx }) => this.responses.submit(input, ctx.req.ip)),

      list: this.trpc.protectedProcedure
        .input(z.object({ formId: z.string().cuid(), page: z.number().default(1), limit: z.number().max(100).default(50) }))
        .query(({ input, ctx }) => this.responses.findAll(input, ctx.userId)),

      exportCsv: this.trpc.protectedProcedure
        .input(z.object({ formId: z.string().cuid() }))
        .query(({ input, ctx }) => this.responses.exportCsv(input.formId, ctx.userId)),

      delete: this.trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => this.responses.delete(input.id, ctx.userId)),
    }),

    // ─── Webhook ──────────────────────────────────────────────────────────────
    webhook: this.trpc.router({
      list: this.trpc.protectedProcedure
        .input(z.object({ formId: z.string().cuid() }))
        .query(({ input, ctx }) => this.webhooks.findAll(input.formId, ctx.userId)),

      create: this.trpc.protectedProcedure
        .input(CreateWebhookSchema)
        .mutation(({ input, ctx }) => this.webhooks.create(input, ctx.userId)),

      toggle: this.trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => this.webhooks.toggle(input.id, ctx.userId)),

      delete: this.trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => this.webhooks.delete(input.id, ctx.userId)),
    }),

    // ─── API Keys ─────────────────────────────────────────────────────────────
    apiKey: this.trpc.router({
      list: this.trpc.protectedProcedure
        .input(z.object({ workspaceId: z.string().cuid() }))
        .query(({ input, ctx }) => this.apiKeys.findAll(input.workspaceId, ctx.userId)),

      create: this.trpc.protectedProcedure
        .input(z.object({ workspaceId: z.string().cuid(), name: z.string().min(1).max(100) }))
        .mutation(({ input, ctx }) => this.apiKeys.create(input.workspaceId, input.name, ctx.userId)),

      revoke: this.trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => this.apiKeys.revoke(input.id, ctx.userId)),
    }),

    // ─── Storage ──────────────────────────────────────────────────────────────
    storage: this.trpc.router({
      getUploadUrl: this.trpc.publicProcedure
        .input(z.object({
          filename: z.string().max(255),
          contentType: z.string(),
          formId: z.string().cuid(),
        }))
        .mutation(async ({ input }) => {
          const key = `uploads/${input.formId}/${Date.now()}-${input.filename}`
          const url = await this.storage.getPresignedUploadUrl(key, input.contentType)
          const publicUrl = `${process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/formcraft'}/${key}`
          return { uploadUrl: url, key, publicUrl }
        }),
    }),
    })
  }
}

export type AppRouter = TrpcRouter['appRouter']
