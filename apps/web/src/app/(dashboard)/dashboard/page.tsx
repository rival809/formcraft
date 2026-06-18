import type { Metadata } from 'next'
import { FormsList } from '@/components/dashboard/forms-list'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Forms</h1>
      </div>
      <FormsList />
    </div>
  )
}
