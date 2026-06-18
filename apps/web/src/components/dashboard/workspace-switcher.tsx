'use client'

import { useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useWorkspaceStore } from '@/lib/store/workspace.store'
import { ChevronDown } from 'lucide-react'

export function WorkspaceSwitcher() {
  const { currentWorkspaceId, setCurrentWorkspace } = useWorkspaceStore()
  const { data: workspaces } = trpc.workspace.list.useQuery()

  // Auto-select first workspace on load
  useEffect(() => {
    if (!currentWorkspaceId && workspaces?.[0]) {
      setCurrentWorkspace(workspaces[0].id)
    }
  }, [workspaces, currentWorkspaceId, setCurrentWorkspace])

  const current = workspaces?.find((w) => w.id === currentWorkspaceId)

  if (!workspaces?.length) return null

  return (
    <div className="relative">
      <select
        value={currentWorkspaceId ?? ''}
        onChange={(e) => setCurrentWorkspace(e.target.value)}
        className="w-full appearance-none rounded-md border bg-background px-3 py-1.5 pr-8 text-sm font-medium cursor-pointer"
      >
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>{ws.name}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  )
}
