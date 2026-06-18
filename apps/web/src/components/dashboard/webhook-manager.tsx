'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@formcraft/ui'
import { Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'

const schema = z.object({
  url: z.string().url('Must be a valid URL'),
  secret: z.string().min(8, 'Min 8 characters').optional().or(z.literal('')),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function WebhookManager({ formId }: { formId: string }) {
  const [showForm, setShowForm] = useState(false)
  const utils = trpc.useUtils()

  const { data: webhooks, isLoading } = trpc.webhook.list.useQuery({ formId })
  const create = trpc.webhook.create.useMutation({
    onSuccess: () => { utils.webhook.list.invalidate({ formId }); setShowForm(false); reset() },
  })
  const toggle = trpc.webhook.toggle.useMutation({ onSuccess: () => utils.webhook.list.invalidate({ formId }) })
  const del = trpc.webhook.delete.useMutation({ onSuccess: () => utils.webhook.list.invalidate({ formId }) })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (values: FormValues) => {
    create.mutate({
      formId,
      url: values.url,
      secret: values.secret || undefined,
      description: values.description,
      events: ['RESPONSE_CREATED'],
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Webhooks</p>
          <p className="text-xs text-muted-foreground">POST to an endpoint on each new response</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5" /> Add webhook
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <div>
            <label className="block text-xs font-medium mb-1">Endpoint URL <span className="text-destructive">*</span></label>
            <input {...register('url')} placeholder="https://your-server.com/webhook" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
            {errors.url && <p className="mt-1 text-xs text-destructive">{errors.url.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Secret key <span className="text-muted-foreground">(optional)</span></label>
            <input {...register('secret')} type="password" placeholder="Used to sign requests" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
            {errors.secret && <p className="mt-1 text-xs text-destructive">{errors.secret.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Description <span className="text-muted-foreground">(optional)</span></label>
            <input {...register('description')} placeholder="e.g. Notify Slack channel" className="w-full rounded-md border bg-background px-3 py-1.5 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={create.isPending}>{create.isPending ? 'Adding...' : 'Add webhook'}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); reset() }}>Cancel</Button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-xs text-muted-foreground">Loading webhooks...</p>}

      <div className="space-y-2">
        {webhooks?.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground py-2">No webhooks yet.</p>
        )}
        {webhooks?.map((wh) => (
          <div key={wh.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono truncate">{wh.url}</p>
              {wh.description && <p className="text-xs text-muted-foreground mt-0.5">{wh.description}</p>}
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`text-xs px-1.5 py-0.5 rounded ${wh.active ? 'bg-green-500/15 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {wh.active ? 'Active' : 'Disabled'}
                </span>
                {wh.failureCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" /> {wh.failureCount} failures
                  </span>
                )}
                {wh.lastDeliveredAt && (
                  <span className="text-xs text-muted-foreground">
                    Last: {new Date(wh.lastDeliveredAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggle.mutate({ id: wh.id })}>
                {wh.active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => confirm('Delete this webhook?') && del.mutate({ id: wh.id })}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
