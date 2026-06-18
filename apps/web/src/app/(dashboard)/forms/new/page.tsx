import type { Metadata } from 'next'
import { NewFormForm } from '@/components/dashboard/new-form-form'

export const metadata: Metadata = { title: 'New Form' }

export default function NewFormPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create a new form</h1>
        <p className="text-sm text-muted-foreground mt-1">Give your form a title to get started.</p>
      </div>
      <NewFormForm />
    </div>
  )
}
