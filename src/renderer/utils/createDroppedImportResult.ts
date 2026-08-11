import type { BatchItem } from '@shared/types'

export const DROPPED_IMPORT_MESSAGES = {
  noLocalPaths: '请从资源管理器拖入本地 JPG、PNG、GIF、WEBP 图片',
  noSupportedImages: '没有可导入的受支持图片文件'
} as const

export interface DroppedImportResult {
  items: BatchItem[]
  error: string | null
}

export async function createDroppedImportResult(
  filePaths: string[],
  createBatchItemsFromPaths: (filePaths: string[]) => Promise<BatchItem[]>
): Promise<DroppedImportResult> {
  if (filePaths.length === 0) {
    return {
      items: [],
      error: DROPPED_IMPORT_MESSAGES.noLocalPaths
    }
  }

  const items = await createBatchItemsFromPaths(filePaths)

  return {
    items,
    error: items.length === 0 ? DROPPED_IMPORT_MESSAGES.noSupportedImages : null
  }
}
