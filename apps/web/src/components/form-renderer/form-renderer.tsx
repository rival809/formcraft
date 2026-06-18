'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@formcraft/ui'
import { FileUploadField } from './file-upload-field'
import type { FormField } from '@formcraft/types'

interface PublicForm {
  id: string
  title: string
  description?: string
  fields: FormField[]
  settings: Record<string, unknown>
}

export function FormRenderer({ form }: { form: PublicForm }) {
  const submit = trpc.response.submit.useMutation()

  const schema = z.object(
    Object.fromEntries(
      form.fields.map((f) => [
        f.id,
        f.validation?.required ? z.string().min(1, 'This field is required') : z.string().optional(),
      ]),
    ),
  )

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = (data: Record<string, unknown>) => {
    submit.mutate({ formId: form.id, data })
  }

  if (submit.isSuccess) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center space-y-2">
        <p className="text-lg font-semibold">Thank you!</p>
        <p className="text-sm text-muted-foreground">
          {(form.settings?.successMessage as string) ?? 'Your response has been submitted.'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-8 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{form.title}</h1>
        {form.description && <p className="mt-1 text-muted-foreground">{form.description}</p>}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {form.fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1.5">
              {field.label}
              {field.validation?.required && <span className="text-destructive ml-0.5">*</span>}
            </label>
            {field.type === 'long_text' ? (
              <textarea
                {...register(field.id)}
                placeholder={field.placeholder}
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              />
            ) : field.type === 'dropdown' ? (
              <select {...register(field.id)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Select...</option>
                {field.choices?.map((c) => <option key={c.id} value={c.value}>{c.label}</option>)}
              </select>
            ) : field.type === 'file_upload' ? (
              <FileUploadField
                fieldId={field.id}
                formId={form.id}
                label={field.label}
                required={field.validation?.required}
                allowedTypes={field.validation?.allowedFileTypes}
                maxSizeMb={field.validation?.maxFileSizeMb}
                value={watch(field.id) as string}
                onChange={(url) => setValue(field.id, url)}
              />
            ) : (
              <input
                {...register(field.id)}
                type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                placeholder={field.placeholder}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            )}
            {errors[field.id] && (
              <p className="mt-1 text-xs text-destructive">{errors[field.id]?.message as string}</p>
            )}
          </div>
        ))}
        <Button type="submit" className="w-full" disabled={submit.isPending}>
          {submit.isPending ? 'Submitting...' : 'Submit'}
        </Button>
        {submit.isError && (
          <p className="text-xs text-center text-destructive">{submit.error.message}</p>
        )}
      </form>
    </div>
  )
}
