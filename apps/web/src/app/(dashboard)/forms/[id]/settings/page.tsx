import type { Metadata } from 'next'
import { FormSettingsTabs } from '@/components/dashboard/form-settings-tabs'

export const metadata: Metadata = { title: 'Form Settings' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function FormSettingsPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Form Settings</h1>
      <FormSettingsTabs formId={id} />
    </div>
  )
}
