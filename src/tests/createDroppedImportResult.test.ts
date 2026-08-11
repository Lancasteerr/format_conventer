import { describe, expect, it, vi } from 'vitest'
import type { BatchItem } from '@shared/types'
import {
  createDroppedImportResult,
  DROPPED_IMPORT_MESSAGES
} from '@renderer/utils/createDroppedImportResult'

describe('createDroppedImportResult', () => {
  it('reports when dropped files do not provide local paths', async () => {
    const createBatchItemsFromPaths = vi.fn<() => Promise<BatchItem[]>>()

    const result = await createDroppedImportResult([], createBatchItemsFromPaths)

    expect(result).toEqual({
      items: [],
      error: DROPPED_IMPORT_MESSAGES.noLocalPaths
    })
    expect(createBatchItemsFromPaths).not.toHaveBeenCalled()
  })

  it('reports when local paths contain no supported images', async () => {
    const createBatchItemsFromPaths = vi.fn(async () => [])

    const result = await createDroppedImportResult(['C:\\images\\notes.txt'], createBatchItemsFromPaths)

    expect(result).toEqual({
      items: [],
      error: DROPPED_IMPORT_MESSAGES.noSupportedImages
    })
    expect(createBatchItemsFromPaths).toHaveBeenCalledWith(['C:\\images\\notes.txt'])
  })

  it('returns imported items when supported images are created', async () => {
    const item: BatchItem = {
      id: 'item-1',
      name: 'photo.png',
      sourcePath: 'C:\\images\\photo.png',
      size: 128,
      detectedFormat: 'png',
      status: 'pending'
    }
    const createBatchItemsFromPaths = vi.fn(async () => [item])

    const result = await createDroppedImportResult(['C:\\images\\photo.png'], createBatchItemsFromPaths)

    expect(result).toEqual({
      items: [item],
      error: null
    })
  })
})
