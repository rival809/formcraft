'use client'

import { trpc } from '@/lib/trpc/client'
import { useBuilderStore } from '@/lib/store/builder.store'
import { Button } from '@formcraft/ui'
import Link from 'next/link'
import { Eye, Globe, Save, ChevronLeft, Settings } from 'lucide-react'

export function BuilderToolbar({ formId }: { formId: string }) {
  const { fields, logic, settings, theme, isDirty, markClean } = useBuilderStore()
  const utils = trpc.useUtils()
  const update = trpc.form.update.useMutation({ onSuccess: () => { markClean(); utils.form.byId.invalidate({ id: formId }) } })
  const publish = trpc.form.publish.useMutation({ onSuccess: () => utils.form.byId.invalidate({ id: formId }) })

  const handleSave = () => update.mutate({ id: formId, data: { fields, logic, settings, theme } })
  const handlePublish = () => publish.mutate({ id: formId })

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Form Builder</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/forms/${formId}/responses`}>
            <Eye className="h-4 w-4" /> Responses
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/forms/${formId}/settings`}>
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave} disabled={!isDirty || update.isPending}>
          <Save className="h-4 w-4" />
          {update.isPending ? 'Saving...' : isDirty ? 'Save*' : 'Saved'}
        </Button>
        <Button size="sm" onClick={handlePublish} disabled={publish.isPending}>
          <Globe className="h-4 w-4" />
          Publish
        </Button>
      </div>
    </header>
  )
}
