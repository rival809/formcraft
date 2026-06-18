import { All, Controller, Req, Res } from '@nestjs/common'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { auth } from './auth.service.js'

// BetterAuth handles all /api/auth/* routes natively
@Controller('auth')
export class AuthController {
  @All('*')
  async handleAuth(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const response = await auth.handler(req.raw as unknown as Request)
    res.status(response.status).headers(Object.fromEntries(response.headers)).send(await response.text())
  }
}
