export const IPC_CHANNELS = {
  selectImages: 'image-converter:select-images',
  selectOutputDir: 'image-converter:select-output-dir',
  createBatchItemsFromPaths: 'image-converter:create-batch-items-from-paths',
  convertBatch: 'image-converter:convert-batch',
  conversionProgress: 'image-converter:conversion-progress'
} as const
