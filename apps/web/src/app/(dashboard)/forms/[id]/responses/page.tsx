import type { Metadata } from 'next'
import { ResponsesTable } from '@/components/dashboard/responses-table'

export const metadata: Metadata = { title: 'Responses' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function ResponsesPage({ params }: Props) {
  const { id } = await params
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Responses</h1>
      <ResponsesTable formId={id} />
    </div>
  )
}
