import { normalizeImageFormat } from '@shared/formats'
import type { BatchItem } from '@shared/types'

export function createBatchItemsFromDroppedFiles(files: FileList, filePaths: string[]): BatchItem[] {
  return Array.from(files)
    .map((file, index) => createBatchItemFromFile(file, filePaths[index]))
    .filter((item): item is BatchItem => item !== null)
}

function createBatchItemFromFile(file: File, sourcePath: string | undefined): BatchItem | null {
  if (!sourcePath) {
    return null
  }

  const detectedFormat = normalizeImageFormat(sourcePath || file.name)

  if (!detectedFormat) {
    return null
  }

  return {
    id: createRendererId(),
    name: file.name,
    sourcePath,
    size: file.size,
    detectedFormat,
    status: 'pending'
  }
}

function createRendererId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
