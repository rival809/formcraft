import type { Metadata } from 'next'
import { BuilderCanvas } from '@/components/builder/builder-canvas'
import { BuilderSidebar } from '@/components/builder/builder-sidebar'
import { BuilderToolbar } from '@/components/builder/builder-toolbar'
import { BuilderHydrator } from '@/components/builder/builder-hydrator'

export const metadata: Metadata = { title: 'Form Builder' }

// Next.js 16: params must be awaited
interface Props {
  params: Promise<{ id: string }>
}

export default async function BuilderPage({ params }: Props) {
  const { id } = await params

  return (
    <BuilderHydrator formId={id}>
      <div className="flex h-screen flex-col overflow-hidden">
        <BuilderToolbar formId={id} />
        <div className="flex flex-1 overflow-hidden">
          <BuilderCanvas />
          <BuilderSidebar />
        </div>
      </div>
    </BuilderHydrator>
  )
}
