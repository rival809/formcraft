import { Controller, Get, Param, Query, Headers, UnauthorizedException } from '@nestjs/common'
import { ApiTags, ApiSecurity } from '@nestjs/swagger'
import { prisma } from '@formcraft/db'

// Public REST API — for external consumers using API keys
@ApiTags('Public API')
@ApiSecurity('ApiKey')
@Controller('public')
export class FormsController {
  @Get('forms/:formId/responses')
  async getResponses(
    @Param('formId') formId: string,
    @Headers('x-api-key') apiKey: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    if (!apiKey) throw new UnauthorizedException('API key required')

    const key = await prisma.apiKey.findUnique({ where: { keyHash: await hashApiKey(apiKey) } })
    if (!key) throw new UnauthorizedException('Invalid API key')

    await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })

    const [responses, total] = await Promise.all([
      prisma.formResponse.findMany({
        where: { formId },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.formResponse.count({ where: { formId } }),
    ])

    return { data: responses, total, page: Number(page), limit: Number(limit) }
  }
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Buffer.from(hashBuffer).toString('hex')
}
