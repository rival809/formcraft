'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useWorkspaceStore } from '@/lib/store/workspace.store'
import { Button } from '@formcraft/ui'
import { Key, Copy, Check, Trash2, Plus, Building2 } from 'lucide-react'

export function WorkspaceSettings() {
  const { currentWorkspaceId, setCurrentWorkspace } = useWorkspaceStore()
  const utils = trpc.useUtils()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const create = trpc.workspace.create.useMutation({
    onSuccess: (ws) => {
      utils.workspace.list.invalidate()
      setCurrentWorkspace(ws.id)
      setName('')
      setSlug('')
    },
  })

  if (!currentWorkspaceId) {
    return (
      <div className="space-y-6 max-w-md">
        <div className="rounded-lg border border-dashed p-8 text-center space-y-2">
          <Building2 className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-medium">No workspace yet</p>
          <p className="text-sm text-muted-foreground">Create a workspace to start building forms.</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-semibold">Create Workspace</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                }}
                placeholder="My Workspace"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                placeholder="my-workspace"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
            </div>
            <Button
              disabled={!name || !slug || create.isPending}
              onClick={() => create.mutate({ name, slug })}
              className="w-full"
            >
              {create.isPending ? 'Creating...' : 'Create Workspace'}
            </Button>
            {create.isError && (
              <p className="text-sm text-destructive">{create.error.message}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <ApiKeyManager workspaceId={currentWorkspaceId} />
    </div>
  )
}

function ApiKeyManager({ workspaceId }: { workspaceId: string }) {
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const utils = trpc.useUtils()

  const { data: keys, isLoading } = trpc.apiKey.list.useQuery({ workspaceId })
  const create = trpc.apiKey.create.useMutation({
    onSuccess: (result) => {
      setRevealedKey(result.key)
      setNewKeyName('')
      utils.apiKey.list.invalidate({ workspaceId })
    },
  })
  const revoke = trpc.apiKey.revoke.useMutation({
    onSuccess: () => utils.apiKey.list.invalidate({ workspaceId }),
  })

  const handleCopy = async () => {
    if (!revealedKey) return
    await navigator.clipboard.writeText(revealedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2"><Key className="h-4 w-4" /> API Keys</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Use API keys to access response data from external systems.
          Keys are shown only once — store them securely.
        </p>
      </div>

      {revealedKey && (
        <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 space-y-2">
          <p className="text-sm font-medium text-green-700">
            Copy your API key now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white/60 px-3 py-1.5 text-xs font-mono break-all border">
              {revealedKey}
            </code>
            <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setRevealedKey(null)}>Dismiss</Button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name, e.g. n8n integration"
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && newKeyName && create.mutate({ workspaceId, name: newKeyName })}
        />
        <Button
          size="sm"
          disabled={!newKeyName || create.isPending}
          onClick={() => create.mutate({ workspaceId, name: newKeyName })}
        >
          <Plus className="h-3.5 w-3.5" />
          {create.isPending ? 'Creating...' : 'Create key'}
        </Button>
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Loading keys...</p>}
      <div className="space-y-2">
        {keys?.length === 0 && <p className="text-xs text-muted-foreground">No API keys yet.</p>}
        {keys?.map((key) => (
          <div key={key.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <div>
              <p className="text-sm font-medium">{key.name}</p>
              <p className="text-xs text-muted-foreground">
                Created {new Date(key.createdAt).toLocaleDateString()}
                {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => confirm(`Revoke key "${key.name}"?`) && revoke.mutate({ id: key.id })}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {keys && keys.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Usage example</p>
          <code className="block text-xs font-mono whitespace-pre-wrap break-all">
            {`GET /api/public/forms/{formId}/responses\nHeaders: { "x-api-key": "fc_..." }`}
          </code>
        </div>
      )}
    </div>
  )
}
