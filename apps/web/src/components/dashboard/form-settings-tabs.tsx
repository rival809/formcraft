'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormSettings } from '@formcraft/types'
import { Button } from '@formcraft/ui'
import { cn } from '@formcraft/ui'
import { WebhookManager } from './webhook-manager'

type Tab = 'general' | 'notifications' | 'webhooks' | 'danger'
const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'danger', label: 'Danger Zone' },
]

export function FormSettingsTabs({ formId }: { formId: string }) {
  const [tab, setTab] = useState<Tab>('general')
  const { data: form, isLoading } = trpc.form.byId.useQuery({ id: formId })
  const update = trpc.form.update.useMutation()
  const utils = trpc.useUtils()

  const settings = (form?.settings ?? {}) as Partial<FormSettings>

  const { register, handleSubmit, formState: { isDirty } } = useForm({
    values: {
      submitButtonText: settings.submitButtonText ?? 'Submit',
      successMessage: settings.successMessage ?? 'Thank you for your response!',
      redirectUrl: settings.redirectUrl ?? '',
      closedMessage: settings.closedMessage ?? 'This form is no longer accepting responses.',
      allowMultipleSubmissions: settings.allowMultipleSubmissions ?? false,
      requireAuth: settings.requireAuth ?? false,
      notifyOwnerOnSubmit: settings.notifyOwnerOnSubmit !== false,
      sendConfirmationEmail: settings.sendConfirmationEmail ?? false,
      responseLimitEnabled: settings.responseLimitEnabled ?? false,
      responseLimit: settings.responseLimit ?? 0,
    },
  })

  const onSave = handleSubmit((values) => {
    update.mutate(
      { id: formId, data: { settings: values } },
      { onSuccess: () => utils.form.byId.invalidate({ id: formId }) },
    )
  })

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-1 border-b mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* General */}
      {tab === 'general' && (
        <form onSubmit={onSave} className="space-y-5">
          <Field label="Submit button text">
            <input {...register('submitButtonText')} className="input" />
          </Field>
          <Field label="Success message">
            <textarea {...register('successMessage')} rows={3} className="input resize-none" />
          </Field>
          <Field label="Redirect URL after submit" hint="Leave blank to show success message">
            <input {...register('redirectUrl')} placeholder="https://..." className="input" />
          </Field>
          <Field label="Closed form message">
            <textarea {...register('closedMessage')} rows={2} className="input resize-none" />
          </Field>
          <div className="space-y-3">
            <Toggle {...register('allowMultipleSubmissions')} label="Allow multiple submissions" />
            <Toggle {...register('requireAuth')} label="Require authentication to submit" />
          </div>
          <Field label="Response limit" hint="Max number of submissions (0 = unlimited)">
            <input {...register('responseLimit', { valueAsNumber: true })} type="number" min={0} className="input w-32" />
          </Field>
          <Button type="submit" disabled={!isDirty || update.isPending}>
            {update.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <form onSubmit={onSave} className="space-y-5">
          <Toggle {...register('notifyOwnerOnSubmit')} label="Notify me by email on each new response" />
          <Toggle {...register('sendConfirmationEmail')} label="Send auto-reply confirmation email to respondent" />
          <Button type="submit" disabled={!isDirty || update.isPending}>
            {update.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      )}

      {/* Webhooks */}
      {tab === 'webhooks' && <WebhookManager formId={formId} />}

      {/* Danger */}
      {tab === 'danger' && <DangerZone formId={formId} />}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {hint && <p className="text-xs text-muted-foreground mb-1.5">{hint}</p>}
      <style>{`.input{width:100%;border-radius:.375rem;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:.375rem .75rem;font-size:.875rem;}`}</style>
      {children}
    </div>
  )
}

function Toggle({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-3 text-sm cursor-pointer">
      <input type="checkbox" {...props} className="h-4 w-4 rounded border" />
      {label}
    </label>
  )
}

function DangerZone({ formId }: { formId: string }) {
  const utils = trpc.useUtils()
  const close = trpc.form.close.useMutation({ onSuccess: () => utils.form.byId.invalidate({ id: formId }) })
  const del = trpc.form.delete.useMutation({ onSuccess: () => (window.location.href = '/dashboard') })

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-destructive/30 p-4 space-y-3">
        <div>
          <p className="text-sm font-medium">Close form</p>
          <p className="text-xs text-muted-foreground">Stop accepting new responses. Existing responses are kept.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => close.mutate({ id: formId })} disabled={close.isPending}>
          Close form
        </Button>
      </div>
      <div className="rounded-lg border border-destructive p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-destructive">Delete form</p>
          <p className="text-xs text-muted-foreground">Permanently delete this form and all responses. This cannot be undone.</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => confirm('Delete this form and all responses?') && del.mutate({ id: formId })}
          disabled={del.isPending}
        >
          Delete form
        </Button>
      </div>
    </div>
  )
}
