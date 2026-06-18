'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBuilderStore } from '@/lib/store/builder.store'
import type { FormField } from '@formcraft/types'
import { GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@formcraft/ui'

function SortableField({ field }: { field: FormField }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  const { selectField, selectedFieldId, removeField } = useBuilderStore()

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      onClick={() => selectField(field.id)}
      className={`group flex items-center gap-3 rounded-lg border bg-card p-4 cursor-pointer hover:border-primary/50 ${selectedFieldId === field.id ? 'border-primary ring-1 ring-primary' : ''}`}
    >
      <span
        className="cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{field.label}</p>
        <p className="text-xs text-muted-foreground">{field.type.replace('_', ' ')}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 h-7 w-7"
        onClick={(e) => { e.stopPropagation(); removeField(field.id) }}
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  )
}

export function BuilderCanvas() {
  const { fields, reorderFields } = useBuilderStore()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const from = fields.findIndex((f) => f.id === active.id)
      const to = fields.findIndex((f) => f.id === over.id)
      reorderFields(from, to)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl space-y-3">
        {fields.length === 0 && (
          <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-sm text-muted-foreground">Add fields from the panel on the right</p>
          </div>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {fields.map((field) => (
              <SortableField key={field.id} field={field} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
