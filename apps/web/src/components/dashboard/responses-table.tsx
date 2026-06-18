'use client'

import { trpc } from '@/lib/trpc/client'
import { Button } from '@formcraft/ui'
import { Download, Trash2 } from 'lucide-react'

export function ResponsesTable({ formId }: { formId: string }) {
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.response.list.useQuery({ formId, page: 1, limit: 50 })
  const del = trpc.response.delete.useMutation({ onSuccess: () => utils.response.list.invalidate({ formId }) })
  const exportCsv = trpc.response.exportCsv.useQuery({ formId }, { enabled: false })

  const handleExport = async () => {
    const result = await exportCsv.refetch()
    if (!result.data) return
    const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = result.data.filename
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading responses...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} total responses</p>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exportCsv.isFetching || !data?.total}>
          <Download className="h-3.5 w-3.5" />
          {exportCsv.isFetching ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      <div className="rounded-lg border divide-y">
        {data?.data.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No responses yet.</p>
        )}
        {data?.data.map((response) => (
          <div key={response.id} className="flex items-start justify-between gap-4 p-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1.5">
                {new Date(response.createdAt).toLocaleString()}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(response.data as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} className="text-xs">
                    <span className="text-muted-foreground">{k}: </span>
                    <span className="font-medium">{Array.isArray(v) ? v.join(', ') : String(v ?? '—')}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => confirm('Delete this response?') && del.mutate({ id: response.id })}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
