import { Injectable } from '@nestjs/common'
import { initTRPC, TRPCError, type AnyRouter, type AnyProcedure } from '@trpc/server'
import type { Context } from './trpc.context.js'

const t = initTRPC.context<Context>().create()

@Injectable()
export class TrpcService {
  readonly router: typeof t.router = t.router
  readonly publicProcedure: typeof t.procedure = t.procedure
  readonly protectedProcedure: typeof t.procedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session?.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({ ctx: { ...ctx, userId: ctx.session.userId } })
  }) as typeof t.procedure
}
