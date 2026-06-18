import type { FastifyRequest, FastifyReply } from 'fastify'

export interface Session {
  userId: string
  email: string
}

export interface Context {
  req: FastifyRequest
  res: FastifyReply
  session: Session | null
}

export async function createContext({
  req,
  res,
}: {
  req: FastifyRequest
  res: FastifyReply
}): Promise<Context> {
  // BetterAuth validates the session token from the Authorization header or cookie
  // Full implementation in auth.service.ts
  return { req, res, session: null }
}
