import type { BatchItem, ConversionProgressEvent, ConvertOptions } from './types'

export interface ImageConverterApi {
  selectImages: () => Promise<BatchItem[]>
  selectOutputDir: () => Promise<string | null>
  getDroppedFilePaths: (files: FileList | File[]) => string[]
  convertBatch: (items: BatchItem[], options: ConvertOptions) => Promise<BatchItem[]>
  onConversionProgress: (callback: (event: ConversionProgressEvent) => void) => () => void
}
