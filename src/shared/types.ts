export const TARGET_FORMATS = ['jpeg', 'png', 'gif', 'webp'] as const

export type TargetFormat = (typeof TARGET_FORMATS)[number]

export type BatchStatus = 'pending' | 'converting' | 'success' | 'error'

export interface BatchItem {
  id: string
  name: string
  sourcePath: string
  size: number
  detectedFormat: TargetFormat
  status: BatchStatus
  outputPath?: string
  outputSize?: number
  outputFormat?: TargetFormat
  outputQuality?: number
  error?: string
}

export interface ConvertOptions {
  targetFormat: TargetFormat
  outputDir: string
  quality?: number
}

export interface OutputSizePreviewOptions {
  targetFormat: TargetFormat
  quality?: number
}

export interface OutputSizePreviewResult {
  id: string
  outputSize?: number
  unavailableReason?: string
  error?: string
}

export interface ConversionProgressEvent {
  item: BatchItem
  completed: number
  total: number
}

export interface ConversionStrategy {
  readAnimatedInput: boolean
  preserveAnimation: boolean
  useFirstFrameOnly: boolean
}
