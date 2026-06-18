import type { Metadata } from 'next'
import { WorkspaceSettings } from '@/components/dashboard/workspace-settings'

export const metadata: Metadata = { title: 'Workspace Settings' }

export default function WorkspaceSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Workspace Settings</h1>
      <WorkspaceSettings />
    </div>
  )
}
