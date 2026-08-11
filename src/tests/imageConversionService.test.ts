import { access, mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ImageConversionService } from '@main/services/imageConversionService'
import type { BatchItem } from '@shared/types'

describe('ImageConversionService', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'image-conversion-service-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('previews jpeg output sizes for the current quality setting', async () => {
    const item = await createTestItem()
    const service = new ImageConversionService()

    const [highQualityPreview] = await service.previewOutputSizes([item], {
      targetFormat: 'jpeg',
      quality: 95
    })
    const [lowQualityPreview] = await service.previewOutputSizes([item], {
      targetFormat: 'jpeg',
      quality: 25
    })

    expect(highQualityPreview.id).toBe(item.id)
    expect(lowQualityPreview.id).toBe(item.id)
    expect(highQualityPreview.outputSize).toEqual(expect.any(Number))
    expect(lowQualityPreview.outputSize).toEqual(expect.any(Number))
    expect(lowQualityPreview.outputSize ?? 0).toBeGreaterThan(0)
    expect(lowQualityPreview.outputSize ?? 0).toBeLessThan(highQualityPreview.outputSize ?? 0)
  })

  it('previews webp and jpeg sizes for a real jpeg source', async () => {
    const item = await createTestItem('jpeg')
    const service = new ImageConversionService()

    const [webpPreview] = await service.previewOutputSizes([item], {
      targetFormat: 'webp',
      quality: 85
    })
    const [jpegPreview] = await service.previewOutputSizes([item], {
      targetFormat: 'jpeg',
      quality: 85
    })

    expect(webpPreview).toMatchObject({
      id: item.id,
      outputSize: expect.any(Number)
    })
    expect(jpegPreview).toMatchObject({
      id: item.id,
      outputSize: expect.any(Number)
    })
    expect(webpPreview.outputSize ?? 0).toBeGreaterThan(0)
    expect(jpegPreview.outputSize ?? 0).toBeGreaterThan(0)
  })

  it('stores the actual output file size after conversion', async () => {
    const item = await createTestItem()
    const outputDir = join(tempDir, 'exports')

    const [result] = await new ImageConversionService().convertBatch([item], {
      targetFormat: 'webp',
      outputDir,
      quality: 70
    })

    expect(result.status).toBe('success')
    expect(result.outputPath).toEqual(expect.any(String))
    expect(result.outputSize).toEqual(expect.any(Number))
    expect(result.outputFormat).toBe('webp')
    expect(result.outputQuality).toBe(70)

    if (!result.outputPath) {
      throw new Error('Expected conversion to create an output file')
    }

    await access(result.outputPath)
    const outputStat = await stat(result.outputPath)

    expect(result.outputSize).toBe(outputStat.size)
    expect(outputStat.size).toBeGreaterThan(0)
  })

  it.each(['png', 'gif'] as const)('marks %s output size previews as quality-inapplicable', async (targetFormat) => {
    const item = await createTestItem()

    const [result] = await new ImageConversionService().previewOutputSizes([item], {
      targetFormat,
      quality: 5
    })

    expect(result).toEqual({
      id: item.id,
      unavailableReason: '质量不适用'
    })
  })

  it('returns a readable per-item error for a truncated jpg preview', async () => {
    const item = await createTruncatedJpegItem()

    const [result] = await new ImageConversionService().previewOutputSizes([item], {
      targetFormat: 'webp',
      quality: 85
    })

    expect(result.id).toBe(item.id)
    expect(result.outputSize).toBeUndefined()
    expect(result.error).toContain('JPG 文件可能已损坏或未完整写入')
  })

  async function createTestItem(format: 'png' | 'jpeg' = 'png'): Promise<BatchItem> {
    const width = 96
    const height = 96
    const channels = 3
    const pixels = createTestPixels(width, height, channels)
    const imagePath = join(tempDir, `source.${format === 'jpeg' ? 'jpg' : format}`)
    const image = sharp(pixels, {
      raw: {
        width,
        height,
        channels
      }
    })

    if (format === 'jpeg') {
      await image.jpeg({ quality: 92 }).toFile(imagePath)
    } else {
      await image.png().toFile(imagePath)
    }

    const imageStat = await stat(imagePath)

    return {
      id: `item-${format}`,
      name: `source.${format === 'jpeg' ? 'jpg' : format}`,
      sourcePath: imagePath,
      size: imageStat.size,
      detectedFormat: format,
      status: 'pending'
    }
  }

  async function createTruncatedJpegItem(): Promise<BatchItem> {
    const width = 96
    const height = 96
    const channels = 3
    const fullJpeg = await sharp(createTestPixels(width, height, channels), {
      raw: {
        width,
        height,
        channels
      }
    })
      .jpeg({ quality: 92 })
      .toBuffer()
    const imagePath = join(tempDir, 'truncated.jpg')
    const truncatedJpeg = fullJpeg.subarray(0, Math.floor(fullJpeg.length * 0.7))

    await writeFile(imagePath, truncatedJpeg)

    const imageStat = await stat(imagePath)

    return {
      id: 'item-truncated-jpeg',
      name: 'truncated.jpg',
      sourcePath: imagePath,
      size: imageStat.size,
      detectedFormat: 'jpeg',
      status: 'pending'
    }
  }

  function createTestPixels(width: number, height: number, channels: number): Buffer {
    const pixels = Buffer.alloc(width * height * channels)

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * channels
        pixels[offset] = (x * 37 + y * 17) % 256
        pixels[offset + 1] = (x * 13 + y * 47) % 256
        pixels[offset + 2] = (x * 71 + y * 23) % 256
      }
    }

    return pixels
  }
})
