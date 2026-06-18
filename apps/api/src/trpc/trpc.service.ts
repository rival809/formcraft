import { Injectable } from '@nestjs/common'
import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { Context } from './trpc.context.js'

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, userId: ctx.session.userId } })
})

@Injectable()
export class TrpcService {
  readonly router = router
  readonly publicProcedure = publicProcedure
  readonly protectedProcedure = protectedProcedure
}
