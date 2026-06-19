import { Injectable } from '@nestjs/common'
import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { Context } from './trpc.context.js'

const t = initTRPC.context<Context>().create({ transformer: superjson })

// Module-level so the return types can be inferred without portability issues
const router = t.router
const publicProcedure = t.procedure
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
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
