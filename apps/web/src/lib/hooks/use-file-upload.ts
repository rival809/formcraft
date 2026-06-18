import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

interface UseFileUploadOptions {
  formId: string
  onSuccess: (publicUrl: string, key: string) => void
  onError?: (err: Error) => void
}

export function useFileUpload({ formId, onSuccess, onError }: UseFileUploadOptions) {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const getUploadUrl = trpc.storage.getUploadUrl.useMutation()

  const upload = async (file: File) => {
    setIsUploading(true)
    setProgress(0)
    try {
      const { uploadUrl, key, publicUrl } = await getUploadUrl.mutateAsync({
        filename: file.name,
        contentType: file.type,
        formId,
      })

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)))
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      setProgress(100)
      onSuccess(publicUrl, key)
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsUploading(false)
    }
  }

  return { upload, progress, isUploading }
}
