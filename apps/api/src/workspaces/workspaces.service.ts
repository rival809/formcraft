import { Injectable } from '@nestjs/common'
import { prisma } from '@formcraft/db'

@Injectable()
export class WorkspacesService {
  async findAllForUser(userId: string) {
    return prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      include: { members: { where: { userId }, select: { role: true } }, _count: { select: { forms: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async create({ name, slug }: { name: string; slug: string }, userId: string) {
    return prisma.workspace.create({
      data: {
        name,
        slug,
        members: { create: { userId, role: 'OWNER' } },
      },
    })
  }
}
