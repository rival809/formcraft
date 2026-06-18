import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FormRenderer } from '@/components/form-renderer/form-renderer'

interface Props {
  params: Promise<{ slug: string }>
}

async function getForm(slug: string) {
  const res = await fetch(`${process.env.API_URL}/api/trpc/form.bySlug?input=${encodeURIComponent(JSON.stringify({ slug }))}`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) return null
  const json = await res.json()
  return json?.result?.data ?? null
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
