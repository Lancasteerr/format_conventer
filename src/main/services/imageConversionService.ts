import { mkdir, stat } from 'node:fs/promises'
import sharp, { type Metadata, type Sharp } from 'sharp'
import type {
  BatchItem,
  ConversionProgressEvent,
  ConvertOptions,
  OutputSizePreviewOptions,
  OutputSizePreviewResult,
  TargetFormat
} from '@shared/types'
import { supportsQualityOption } from '@shared/formats'
import { normalizeQuality } from '@shared/quality'
import { createAvailableOutputPath } from '@main/utils/outputPath'
import { getConversionStrategy } from './conversionStrategy'

type ProgressCallback = (event: ConversionProgressEvent) => void
type FormatOptions = Pick<ConvertOptions, 'targetFormat' | 'quality'>

const ANIMATED_SOURCE_FORMATS = new Set<TargetFormat>(['gif', 'webp'])

export class ImageConversionService {
  async previewOutputSizes(
    items: BatchItem[],
    options: OutputSizePreviewOptions
  ): Promise<OutputSizePreviewResult[]> {
    if (!supportsQualityOption(options.targetFormat)) {
      return items.map((item) => ({
        id: item.id,
        unavailableReason: '质量不适用'
      }))
    }

    return Promise.all(items.map((item) => this.previewOutputSize(item, options)))
  }

  async convertBatch(
    items: BatchItem[],
    options: ConvertOptions,
    onProgress?: ProgressCallback
  ): Promise<BatchItem[]> {
    await mkdir(options.outputDir, { recursive: true })

    const results: BatchItem[] = []
    const total = items.length

    for (const item of items) {
      onProgress?.({
        item: clearOutputResult({ ...item, status: 'converting', error: undefined }),
        completed: results.length,
        total
      })

      const result = await this.convertOne(item, options)
      results.push(result)

      onProgress?.({
        item: result,
        completed: results.length,
        total
      })
    }

    return results
  }

  private async convertOne(item: BatchItem, options: ConvertOptions): Promise<BatchItem> {
    try {
      const outputPath = createAvailableOutputPath(item.sourcePath, options.outputDir, options.targetFormat)
      const formattedPipeline = await this.createFormattedPipeline(item, options)

      await formattedPipeline.toFile(outputPath)
      const outputStat = await stat(outputPath)

      return {
        ...item,
        status: 'success',
        outputPath,
        outputSize: outputStat.size,
        outputFormat: options.targetFormat,
        outputQuality: supportsQualityOption(options.targetFormat)
          ? normalizeQuality(options.quality)
          : undefined,
        error: undefined
      }
    } catch (error) {
      return {
        ...item,
        status: 'error',
        outputPath: undefined,
        outputSize: undefined,
        outputFormat: undefined,
        outputQuality: undefined,
        error: error instanceof Error ? error.message : '转换失败'
      }
    }
  }

  private async previewOutputSize(
    item: BatchItem,
    options: OutputSizePreviewOptions
  ): Promise<OutputSizePreviewResult> {
    try {
      const formattedPipeline = await this.createFormattedPipeline(item, options)
      const outputBuffer = await formattedPipeline.toBuffer()

      return {
        id: item.id,
        outputSize: outputBuffer.byteLength
      }
    } catch (error) {
      return {
        id: item.id,
        error: getPreviewErrorMessage(item, error)
      }
    }
  }

  private async createFormattedPipeline(item: BatchItem, options: FormatOptions): Promise<Sharp> {
    const metadata = await this.readMetadata(item)
    const strategy = getConversionStrategy(item.detectedFormat, options.targetFormat, metadata.pages ?? 1)

    /*
     * 动图策略：
     * - GIF/WebP 互转时读取全部帧，尽量保留动画信息；
     * - 转 JPG/PNG 时不启用 animated，sharp 默认只处理首帧。
     */
    const pipeline = sharp(item.sourcePath, { animated: strategy.readAnimatedInput }).rotate()

    return this.applyTargetFormat(pipeline, options.targetFormat, options.quality, metadata)
  }

  private readMetadata(item: BatchItem): Promise<Metadata> {
    return sharp(item.sourcePath, {
      animated: ANIMATED_SOURCE_FORMATS.has(item.detectedFormat)
    }).metadata()
  }

  private applyTargetFormat(
    pipeline: Sharp,
    targetFormat: TargetFormat,
    quality: number | undefined,
    metadata: Metadata
  ): Sharp {
    const normalizedQuality = normalizeQuality(quality)

    switch (targetFormat) {
      case 'jpeg':
        return pipeline
          .flatten({ background: '#ffffff' })
          .jpeg({ quality: normalizedQuality, mozjpeg: true })
      case 'png':
        return pipeline.png()
      case 'gif':
        return pipeline.gif({
          effort: 7,
          ...getAnimationOptions(metadata)
        })
      case 'webp':
        return pipeline.webp({
          quality: normalizedQuality,
          effort: 4,
          ...getAnimationOptions(metadata)
        })
    }
  }
}

function getAnimationOptions(metadata: Metadata): Pick<Metadata, 'delay' | 'loop'> {
  return {
    ...(metadata.delay ? { delay: metadata.delay } : {}),
    ...(typeof metadata.loop === 'number' ? { loop: metadata.loop } : {})
  }
}

function clearOutputResult(item: BatchItem): BatchItem {
  return {
    ...item,
    outputPath: undefined,
    outputSize: undefined,
    outputFormat: undefined,
    outputQuality: undefined
  }
}

function getPreviewErrorMessage(item: BatchItem, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (isFileReadError(error)) {
    return `文件无法读取：${message}`
  }

  if (item.detectedFormat === 'jpeg' && isJpegDecodeError(message)) {
    return `JPG 文件可能已损坏或未完整写入：${message}`
  }

  if (/unsupported image format|Input file contains unsupported image format/i.test(message)) {
    return `文件不是可识别的图片：${message}`
  }

  return `预览失败：${message}`
}

function isFileReadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    ['ENOENT', 'EACCES', 'EPERM', 'EBUSY'].includes(String(error.code))
  )
}

function isJpegDecodeError(message: string): boolean {
  return /jpe?g|vipsjpeg|premature end|corrupt|unsupported marker|invalid sos|invalid jpeg/i.test(message)
}
