'use client'

import { useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useBuilderStore } from '@/lib/store/builder.store'
import type { FormField, LogicRule } from '@formcraft/types'

export function BuilderHydrator({ formId, children }: { formId: string; children: React.ReactNode }) {
  const { data } = trpc.form.byId.useQuery({ id: formId })
  const { hydrate, setFormId } = useBuilderStore()

  useEffect(() => {
    setFormId(formId)
    if (data) {
      hydrate({
        fields: (data.fields as FormField[]) ?? [],
        logic: (data.logic as LogicRule[]) ?? [],
        settings: (data.settings as object) ?? {},
        theme: (data.theme as object) ?? {},
      })
    }
  }, [data, formId, hydrate, setFormId])

  return <>{children}</>
}
