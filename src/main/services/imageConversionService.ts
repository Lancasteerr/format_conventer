import { mkdir } from 'node:fs/promises'
import sharp, { type Metadata, type Sharp } from 'sharp'
import type { BatchItem, ConversionProgressEvent, ConvertOptions, TargetFormat } from '@shared/types'
import { createAvailableOutputPath } from '@main/utils/outputPath'
import { getConversionStrategy } from './conversionStrategy'

type ProgressCallback = (event: ConversionProgressEvent) => void

export class ImageConversionService {
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
        item: { ...item, status: 'converting', error: undefined },
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
      const metadata = await sharp(item.sourcePath, { animated: true }).metadata()
      const strategy = getConversionStrategy(item.detectedFormat, options.targetFormat, metadata.pages ?? 1)

      /*
       * 动图策略：
       * - GIF/WebP 互转时读取全部帧，尽量保留动画信息；
       * - 转 JPG/PNG 时不启用 animated，sharp 默认只处理首帧。
       */
      const pipeline = sharp(item.sourcePath, { animated: strategy.readAnimatedInput }).rotate()
      const formattedPipeline = this.applyTargetFormat(pipeline, options.targetFormat, options.quality, metadata)

      await formattedPipeline.toFile(outputPath)

      return {
        ...item,
        status: 'success',
        outputPath,
        error: undefined
      }
    } catch (error) {
      return {
        ...item,
        status: 'error',
        outputPath: undefined,
        error: error instanceof Error ? error.message : '转换失败'
      }
    }
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

function normalizeQuality(quality: number | undefined): number {
  if (typeof quality !== 'number' || Number.isNaN(quality)) {
    return 85
  }

  return Math.min(100, Math.max(1, Math.round(quality)))
}

function getAnimationOptions(metadata: Metadata): Pick<Metadata, 'delay' | 'loop'> {
  return {
    ...(metadata.delay ? { delay: metadata.delay } : {}),
    ...(typeof metadata.loop === 'number' ? { loop: metadata.loop } : {})
  }
}
