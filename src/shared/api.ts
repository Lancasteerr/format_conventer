import type { BatchItem, ConversionProgressEvent, ConvertOptions } from './types'

export interface ImageConverterApi {
  selectImages: () => Promise<BatchItem[]>
  selectOutputDir: () => Promise<string | null>
  getDroppedFilePaths: (files: File[]) => string[]
  createBatchItemsFromPaths: (filePaths: string[]) => Promise<BatchItem[]>
  convertBatch: (items: BatchItem[], options: ConvertOptions) => Promise<BatchItem[]>
  onConversionProgress: (callback: (event: ConversionProgressEvent) => void) => () => void
}
