'use client'

import { useBuilderStore } from '@/lib/store/builder.store'
import type { FieldType } from '@formcraft/types'
import { Button } from '@formcraft/ui'
import { Type, Hash, Mail, Calendar, ChevronDown, CheckSquare, Star, FileUp } from 'lucide-react'

const FIELD_PALETTE: { type: FieldType; label: string; icon: React.ElementType }[] = [
  { type: 'short_text', label: 'Short Text', icon: Type },
  { type: 'long_text', label: 'Long Text', icon: Type },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'rating', label: 'Rating', icon: Star },
  { type: 'file_upload', label: 'File Upload', icon: FileUp },
]

export function BuilderSidebar() {
  const { addField, selectedFieldId, fields, updateField } = useBuilderStore()
  const selectedField = fields.find((f) => f.id === selectedFieldId)

  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l bg-card p-4 space-y-6">
      {/* Field palette */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Field</p>
        <div className="grid grid-cols-2 gap-2">
          {FIELD_PALETTE.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => addField(type)}
              className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs font-medium hover:border-primary/50 hover:bg-accent transition-colors"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Field properties */}
      {selectedField && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field Properties</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Label</label>
              <input
                value={selectedField.label}
                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Placeholder</label>
              <input
                value={selectedField.placeholder ?? ''}
                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedField.validation?.required ?? false}
                onChange={(e) => updateField(selectedField.id, { validation: { ...selectedField.validation, required: e.target.checked } })}
              />
              Required
            </label>
          </div>
        </div>
      )}
    </aside>
  )
}
