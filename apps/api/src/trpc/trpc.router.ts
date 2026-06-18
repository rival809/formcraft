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

// Module-level factory — TypeScript can infer the full return type here,
// which makes `AppRouter` exportable with proper type info.
function buildRouter(
  trpc: TrpcService,
  forms: FormsService,
  responses: ResponsesService,
  workspaces: WorkspacesService,
  webhooks: WebhooksService,
  apiKeys: ApiKeysService,
  storage: StorageService,
) {
  return trpc.router({
    workspace: trpc.router({
      list: trpc.protectedProcedure
        .query(({ ctx }) => workspaces.findAllForUser(ctx.userId)),
      create: trpc.protectedProcedure
        .input(z.object({ name: z.string().min(1), slug: z.string().min(1).regex(/^[a-z0-9-]+$/) }))
        .mutation(({ input, ctx }) => workspaces.create(input, ctx.userId)),
    }),

    form: trpc.router({
      list: trpc.protectedProcedure
        .input(z.object({ workspaceId: z.string().cuid() }))
        .query(({ input, ctx }) => forms.findAll(input.workspaceId, ctx.userId)),
      byId: trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .query(({ input, ctx }) => forms.findOne(input.id, ctx.userId)),
      bySlug: trpc.publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(({ input }) => forms.findPublicBySlug(input.slug)),
      create: trpc.protectedProcedure
        .input(CreateFormSchema)
        .mutation(({ input, ctx }) => forms.create(input, ctx.userId)),
      update: trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid(), data: UpdateFormSchema }))
        .mutation(({ input, ctx }) => forms.update(input.id, input.data, ctx.userId)),
      publish: trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => forms.publish(input.id, ctx.userId)),
      close: trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => forms.close(input.id, ctx.userId)),
      delete: trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => forms.delete(input.id, ctx.userId)),
      duplicate: trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => forms.duplicate(input.id, ctx.userId)),
    }),

    response: trpc.router({
      submit: trpc.publicProcedure
        .input(SubmitResponseSchema)
        .mutation(({ input, ctx }) => responses.submit(input, ctx.req.ip)),
      list: trpc.protectedProcedure
        .input(z.object({ formId: z.string().cuid(), page: z.number().default(1), limit: z.number().max(100).default(50) }))
        .query(({ input, ctx }) => responses.findAll(input, ctx.userId)),
      exportCsv: trpc.protectedProcedure
        .input(z.object({ formId: z.string().cuid() }))
        .query(({ input, ctx }) => responses.exportCsv(input.formId, ctx.userId)),
      delete: trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => responses.delete(input.id, ctx.userId)),
    }),

    webhook: trpc.router({
      list: trpc.protectedProcedure
        .input(z.object({ formId: z.string().cuid() }))
        .query(({ input, ctx }) => webhooks.findAll(input.formId, ctx.userId)),
      create: trpc.protectedProcedure
        .input(CreateWebhookSchema)
        .mutation(({ input, ctx }) => webhooks.create(input, ctx.userId)),
      toggle: trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => webhooks.toggle(input.id, ctx.userId)),
      delete: trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => webhooks.delete(input.id, ctx.userId)),
    }),

    apiKey: trpc.router({
      list: trpc.protectedProcedure
        .input(z.object({ workspaceId: z.string().cuid() }))
        .query(({ input, ctx }) => apiKeys.findAll(input.workspaceId, ctx.userId)),
      create: trpc.protectedProcedure
        .input(z.object({ workspaceId: z.string().cuid(), name: z.string().min(1).max(100) }))
        .mutation(({ input, ctx }) => apiKeys.create(input.workspaceId, input.name, ctx.userId)),
      revoke: trpc.protectedProcedure
        .input(z.object({ id: z.string().cuid() }))
        .mutation(({ input, ctx }) => apiKeys.revoke(input.id, ctx.userId)),
    }),

    storage: trpc.router({
      getUploadUrl: trpc.publicProcedure
        .input(z.object({
          filename: z.string().max(255),
          contentType: z.string(),
          formId: z.string().cuid(),
        }))
        .mutation(async ({ input }) => {
          const key = `uploads/${input.formId}/${Date.now()}-${input.filename}`
          const url = await storage.getPresignedUploadUrl(key, input.contentType)
          const publicUrl = `${process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/formcraft'}/${key}`
          return { uploadUrl: url, key, publicUrl }
        }),
    }),
  })
}

export type AppRouter = ReturnType<typeof buildRouter>

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

  appRouter!: AppRouter

  onModuleInit() {
    this.appRouter = buildRouter(
      this.trpc,
      this.forms,
      this.responses,
      this.workspaces,
      this.webhooks,
      this.apiKeys,
      this.storage,
    )
  }
}
