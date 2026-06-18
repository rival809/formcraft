import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { prisma } from '@formcraft/db'
import type { CreateFormInput, UpdateFormInput } from '@formcraft/types'
import { nanoid } from 'nanoid'

@Injectable()
export class FormsService {
  async findAll(workspaceId: string, userId: string) {
    await this.assertWorkspaceMember(workspaceId, userId)
    return prisma.form.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, slug: true, title: true, status: true, updatedAt: true, createdAt: true, _count: { select: { responses: true } } },
    })
  }

  async findOne(id: string, userId: string) {
    const form = await prisma.form.findUnique({ where: { id } })
    if (!form) throw new NotFoundException('Form not found')
    await this.assertWorkspaceMember(form.workspaceId, userId)
    return form
  }

  async findPublicBySlug(slug: string) {
    const form = await prisma.form.findUnique({
      where: { slug, status: 'PUBLISHED' },
      select: { id: true, title: true, description: true, fields: true, logic: true, settings: true, theme: true },
    })
    if (!form) throw new NotFoundException('Form not found or not published')
    return form
  }

  async create(input: CreateFormInput, userId: string) {
    await this.assertWorkspaceMember(input.workspaceId, userId)
    return prisma.form.create({
      data: {
        title: input.title,
        description: input.description,
        workspaceId: input.workspaceId,
        slug: nanoid(10),
      },
    })
  }

  async update(id: string, data: UpdateFormInput, userId: string) {
    const form = await this.findOne(id, userId)
    return prisma.form.update({
      where: { id: form.id },
      data: {
        ...data,
        fields: data.fields as never,
        logic: data.logic as never,
        settings: data.settings as never,
        theme: data.theme as never,
      },
    })
  }

  async publish(id: string, userId: string) {
    const form = await this.findOne(id, userId)
    return prisma.form.update({
      where: { id: form.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    })
  }

  async close(id: string, userId: string) {
    const form = await this.findOne(id, userId)
    return prisma.form.update({
      where: { id: form.id },
      data: { status: 'CLOSED', closedAt: new Date() },
    })
  }

  async delete(id: string, userId: string) {
    const form = await this.findOne(id, userId)
    await prisma.form.delete({ where: { id: form.id } })
    return { success: true }
  }

  async duplicate(id: string, userId: string) {
    const form = await this.findOne(id, userId)
    return prisma.form.create({
      data: {
        title: `${form.title} (copy)`,
        description: form.description,
        workspaceId: form.workspaceId,
        slug: nanoid(10),
        fields: form.fields ?? [],
        logic: form.logic ?? [],
        settings: form.settings ?? {},
        theme: form.theme ?? {},
        status: 'DRAFT',
      },
    })
  }

  private async assertWorkspaceMember(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    })
    if (!member) throw new ForbiddenException('Not a workspace member')
    return member
  }
}
