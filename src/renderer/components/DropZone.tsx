import { useState } from 'react'
import { ImagePlus } from 'lucide-react'

interface DropZoneProps {
  disabled: boolean
  onDropFiles: (filePaths: string[]) => void
}

export function DropZone({ disabled, onDropFiles }: DropZoneProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false)

  function handleDragOver(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'

    if (!disabled) {
      setIsDragging(true)
    }
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    setIsDragging(false)

    if (disabled || event.dataTransfer.files.length === 0) {
      return
    }

    const droppedFiles = Array.from(event.dataTransfer.files)
    const filePaths = window.imageConverter.getDroppedFilePaths(droppedFiles)
    onDropFiles(filePaths)
  }

  return (
    <section
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ImagePlus size={28} />
      <div>
        <strong>拖拽 JPG、PNG、GIF、WEBP 到这里</strong>
        <span>也可以使用上方按钮批量选择文件</span>
      </div>
    </section>
  )
}
