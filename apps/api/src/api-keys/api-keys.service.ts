import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { prisma } from '@formcraft/db'
import { randomBytes, createHash } from 'crypto'

@Injectable()
export class ApiKeysService {
  async findAll(workspaceId: string, userId: string) {
    await this.assertWorkspaceMember(workspaceId, userId)
    return prisma.apiKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    })
  }

  async create(workspaceId: string, name: string, userId: string) {
    await this.assertWorkspaceMember(workspaceId, userId, ['OWNER', 'ADMIN'])

    const raw = `fc_${randomBytes(32).toString('hex')}`
    const keyHash = createHash('sha256').update(raw).digest('hex')

    await prisma.apiKey.create({
      data: { workspaceId, name, keyHash },
    })

    // Raw key returned ONCE — never stored in plaintext
    return { key: raw, name }
  }

  async revoke(id: string, userId: string) {
    const key = await prisma.apiKey.findUnique({ where: { id } })
    if (!key) throw new NotFoundException('API key not found')
    await this.assertWorkspaceMember(key.workspaceId, userId, ['OWNER', 'ADMIN'])
    await prisma.apiKey.delete({ where: { id } })
    return { success: true }
  }

  private async assertWorkspaceMember(
    workspaceId: string,
    userId: string,
    roles: string[] = ['OWNER', 'ADMIN', 'MEMBER'],
  ) {
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    })
    if (!member) throw new ForbiddenException('Not a workspace member')
    if (!roles.includes(member.role)) throw new ForbiddenException('Insufficient role')
    return member
  }
}
