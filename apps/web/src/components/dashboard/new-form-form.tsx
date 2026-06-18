'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@formcraft/ui'
import { trpc } from '@/lib/trpc/client'
import { useWorkspaceStore } from '@/lib/store/workspace.store'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
})

type FormValues = z.infer<typeof schema>

export function NewFormForm() {
  const router = useRouter()
  const { currentWorkspaceId } = useWorkspaceStore()
  const create = trpc.form.create.useMutation({
    onSuccess: (form) => router.push(`/forms/${form.id}/builder`),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (values: FormValues) => {
    if (!currentWorkspaceId) return
    create.mutate({ ...values, workspaceId: currentWorkspaceId })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-lg border bg-card p-6">
      <div>
        <label className="block text-sm font-medium mb-1.5">Form Title <span className="text-destructive">*</span></label>
        <input
          {...register('title')}
          placeholder="e.g. Customer Feedback Survey"
          autoFocus
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Description <span className="text-xs text-muted-foreground">(optional)</span></label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Describe the purpose of this form..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
        />
      </div>
      {create.isError && <p className="text-xs text-destructive">{create.error.message}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || create.isPending}>
          {create.isPending ? 'Creating...' : 'Create & open builder'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
