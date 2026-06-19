import { All, Controller, Req, Res } from '@nestjs/common'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { TrpcRouter } from './trpc.router.js'
import { auth } from '../auth/auth.service.js'
import type { Context } from './trpc.context.js'

@Controller('trpc')
export class TrpcController {
  constructor(private readonly trpcRouter: TrpcRouter) {}

  @All('*')
  async handle(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const headers = new Headers()
    for (const [key, val] of Object.entries(req.headers)) {
      if (val) headers.set(key, Array.isArray(val) ? val.join(', ') : val)
    }

    // Validate BetterAuth session from request cookies/bearer token
    let session: Context['session'] = null
    try {
      const sessionData = await auth.api.getSession({ headers })
      if (sessionData?.user) {
        session = { userId: sessionData.user.id, email: sessionData.user.email }
      }
    } catch {
      // Unauthenticated — protectedProcedure will reject with UNAUTHORIZED
    }

    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)

    const fetchReq = new Request(url.toString(), {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })

    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req: fetchReq,
      router: this.trpcRouter.appRouter,
      createContext: (): Context => ({ req, res, session }),
    })

    res.status(response.status)
    response.headers.forEach((value, key) => void res.header(key, value))
    res.send(await response.text())
  }
}
