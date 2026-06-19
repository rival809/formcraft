import { All, Controller, Req, Res } from '@nestjs/common'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { auth } from './auth.service.js'

@Controller('auth')
export class AuthController {
  @All('*')
  async handleAuth(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)

    const headers = new Headers()
    for (const [key, val] of Object.entries(req.headers)) {
      if (val) headers.set(key, Array.isArray(val) ? val.join(', ') : val)
    }

    const fetchReq = new Request(url.toString(), {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })

    const response = await auth.handler(fetchReq)

    res.status(response.status)
    response.headers.forEach((value, key) => void res.header(key, value))
    res.send(await response.text())
  }
}
