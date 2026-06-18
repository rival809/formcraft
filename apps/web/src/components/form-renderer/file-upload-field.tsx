'use client'

import { useRef } from 'react'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { Upload, CheckCircle, Loader2 } from 'lucide-react'

interface Props {
  fieldId: string
  formId: string
  label: string
  required?: boolean
  allowedTypes?: string[]
  maxSizeMb?: number
  value?: string
  onChange: (publicUrl: string) => void
}

export function FileUploadField({ fieldId, formId, label, required, allowedTypes, maxSizeMb = 10, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const { upload, progress, isUploading } = useFileUpload({
    formId,
    onSuccess: (publicUrl) => onChange(publicUrl),
  })

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      alert(`File size must be under ${maxSizeMb}MB`)
      return
    }
    await upload(file)
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        ref={inputRef}
        type="file"
        id={fieldId}
        accept={allowedTypes?.join(',')}
        onChange={handleChange}
        className="hidden"
      />
      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          <span className="truncate text-green-700">{value.split('/').pop()}</span>
          <button
            type="button"
            onClick={() => { onChange(''); if (inputRef.current) inputRef.current.value = '' }}
            className="ml-auto text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        </div>
      ) : isUploading ? (
        <div className="rounded-md border px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading... {progress}%
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-sm text-muted-foreground hover:border-primary/50 hover:bg-accent transition-colors"
        >
          <Upload className="h-6 w-6" />
          <span>Click to upload{maxSizeMb && ` (max ${maxSizeMb}MB)`}</span>
          {allowedTypes && <span className="text-xs">{allowedTypes.join(', ')}</span>}
        </button>
      )}
    </div>
  )
}
