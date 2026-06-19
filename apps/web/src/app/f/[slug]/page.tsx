import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import superjson from 'superjson'
import { FormRenderer } from '@/components/form-renderer/form-renderer'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

async function getForm(slug: string) {
  const apiUrl = process.env.API_URL ?? 'http://api:4000'
  try {
    const res = await fetch(`${apiUrl}/api/trpc/form.bySlug?input=${encodeURIComponent(JSON.stringify({ slug }))}`)
    if (!res.ok) return null
    const json = await res.json()
    if (!json?.result?.data) return null
    return superjson.deserialize(json.result.data)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const form = await getForm(slug)
  return { title: form?.title ?? 'Form' }
}

export default async function PublicFormPage({ params }: Props) {
  const { slug } = await params
  const form = await getForm(slug)
  if (!form) notFound()

  return (
    <div className="min-h-screen bg-muted/40 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <FormRenderer form={form} />
      </div>
    </div>
  )
}
