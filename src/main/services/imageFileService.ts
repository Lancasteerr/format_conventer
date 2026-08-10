import { randomUUID } from 'node:crypto'
import { stat } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { isSupportedImagePath, normalizeImageFormat } from '@shared/formats'
import type { BatchItem } from '@shared/types'

export class ImageFileService {
  async createBatchItems(filePaths: string[]): Promise<BatchItem[]> {
    const uniquePaths = [...new Set(filePaths.map((filePath) => resolve(filePath)))]
    const items = await Promise.all(uniquePaths.map((filePath) => this.createBatchItem(filePath)))

    return items.filter((item): item is BatchItem => item !== null)
  }

  private async createBatchItem(filePath: string): Promise<BatchItem | null> {
    if (!isSupportedImagePath(filePath)) {
      return null
    }

    const fileStat = await stat(filePath).catch(() => null)

    if (!fileStat?.isFile()) {
      return null
    }

    const detectedFormat = normalizeImageFormat(filePath)

    if (!detectedFormat) {
      return null
    }

    return {
      id: randomUUID(),
      name: basename(filePath),
      sourcePath: filePath,
      size: fileStat.size,
      detectedFormat,
      status: 'pending'
    }
  }
}
