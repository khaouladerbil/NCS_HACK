import type { ReactNode } from 'react'
import { useState } from 'react'
import { Scale } from 'lucide-react'
import { cn } from '@/lib/utils'

type FileUploadProps = {
  children: ReactNode
  onFilesAdded: (files: File[]) => void
  className?: string
}

export function FileUpload({ children, onFilesAdded, className }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrag = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setIsDragActive(true)
    } else if (event.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)

    const files = event.dataTransfer.files
    if (files?.[0]) {
      onFilesAdded(Array.from(files))
    }
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={cn('relative w-full', className)}
    >
      {children}

      {isDragActive ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-sand)] bg-[rgba(252,245,210,0.94)] p-6 backdrop-blur-xs">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-3 rounded-full bg-[var(--color-sun-100)] p-4 text-[var(--color-espresso)]">
              <Scale className="size-8 animate-bounce" />
            </div>
            <p className="text-base font-semibold text-[var(--color-espresso)]">
              Drop legal files here
            </p>
            <p className="mt-1 text-sm text-[var(--color-espresso-500)]">
              Upload notices, letters, contracts, or forms (.pdf, .docx, .jpg, .png)
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
