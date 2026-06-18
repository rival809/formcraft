'use client'

import { trpc } from '@/lib/trpc/client'
import { useWorkspaceStore } from '@/lib/store/workspace.store'
import { Button } from '@formcraft/ui'
import Link from 'next/link'
import { Plus, ExternalLink, Copy, Settings } from 'lucide-react'

export function FormsList() {
  const { currentWorkspaceId } = useWorkspaceStore()
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.form.list.useQuery(
    { workspaceId: currentWorkspaceId! },
    { enabled: !!currentWorkspaceId },
  )
  const duplicate = trpc.form.duplicate.useMutation({
    onSuccess: () => utils.form.list.invalidate({ workspaceId: currentWorkspaceId! }),
  })

  if (!currentWorkspaceId) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">No workspace selected. Go to Settings to create one.</p>
      </div>
    )
  }

  if (isLoading) return <div className="text-muted-foreground text-sm">Loading forms...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href="/forms/new"><Plus className="h-4 w-4" /> New Form</Link>
        </Button>
      </div>
      <div className="rounded-lg border divide-y">
        {data?.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">No forms yet. Create your first form!</p>
        )}
        {data?.map((form) => (
          <div key={form.id} className="flex items-center gap-3 p-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{form.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {form._count.responses} responses ·{' '}
                <span className={`${form.status === 'PUBLISHED' ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {form.status.toLowerCase()}
                </span>
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/forms/${form.id}/builder`}>Edit</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/forms/${form.id}/responses`}>Responses</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/forms/${form.id}/settings`}><Settings className="h-3.5 w-3.5" /></Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => duplicate.mutate({ id: form.id })}
                title="Duplicate form"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/f/${form.slug}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
