import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { FormField, LogicRule, FormSettings, FormTheme } from '@formcraft/types'
import { nanoid } from 'nanoid'

interface BuilderState {
  formId: string | null
  fields: FormField[]
  logic: LogicRule[]
  settings: Partial<FormSettings>
  theme: Partial<FormTheme>
  selectedFieldId: string | null
  isDirty: boolean

  // Actions
  setFormId: (id: string) => void
  addField: (type: FormField['type']) => void
  updateField: (id: string, updates: Partial<FormField>) => void
  removeField: (id: string) => void
  reorderFields: (fromIndex: number, toIndex: number) => void
  selectField: (id: string | null) => void
  updateSettings: (settings: Partial<FormSettings>) => void
  updateTheme: (theme: Partial<FormTheme>) => void
  hydrate: (data: Pick<BuilderState, 'fields' | 'logic' | 'settings' | 'theme'>) => void
  markClean: () => void
}

export const useBuilderStore = create<BuilderState>()(
  devtools(
    (set) => ({
      formId: null,
      fields: [],
      logic: [],
      settings: {},
      theme: {},
      selectedFieldId: null,
      isDirty: false,

      setFormId: (id) => set({ formId: id }),

      addField: (type) =>
        set((state) => ({
          fields: [
            ...state.fields,
            { id: nanoid(), type, label: `New ${type.replace('_', ' ')}`, width: 'full' },
          ],
          isDirty: true,
        })),

      updateField: (id, updates) =>
        set((state) => ({
          fields: state.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
          isDirty: true,
        })),

      removeField: (id) =>
        set((state) => ({
          fields: state.fields.filter((f) => f.id !== id),
          selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
          isDirty: true,
        })),

      reorderFields: (fromIndex, toIndex) =>
        set((state) => {
          const fields = [...state.fields]
          const [moved] = fields.splice(fromIndex, 1)
          fields.splice(toIndex, 0, moved)
          return { fields, isDirty: true }
        }),

      selectField: (id) => set({ selectedFieldId: id }),

      updateSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings }, isDirty: true })),

      updateTheme: (theme) =>
        set((state) => ({ theme: { ...state.theme, ...theme }, isDirty: true })),

      hydrate: (data) => set({ ...data, isDirty: false }),

      markClean: () => set({ isDirty: false }),
    }),
    { name: 'FormBuilder' },
  ),
)
