import { Injectable } from '@nestjs/common'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@formcraft/db'

// BETTER_AUTH_URL = public URL of the app (e.g. http://34.128.90.250)
// Used for trusted origins (CSRF protection) and cookie domain.
const appUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  trustedOrigins: [appUrl, 'http://localhost:3000'],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },
})

@Injectable()
export class AuthService {
  async validateSession(token: string) {
    const session = await auth.api.getSession({ headers: new Headers({ authorization: `Bearer ${token}` }) })
    return session
  }
}
