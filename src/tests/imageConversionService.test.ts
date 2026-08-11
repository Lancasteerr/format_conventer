import { access, mkdtemp, rm, stat } from 'node:fs/promises'
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

  async function createTestItem(): Promise<BatchItem> {
    const width = 96
    const height = 96
    const channels = 3
    const pixels = Buffer.alloc(width * height * channels)

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * channels
        pixels[offset] = (x * 37 + y * 17) % 256
        pixels[offset + 1] = (x * 13 + y * 47) % 256
        pixels[offset + 2] = (x * 71 + y * 23) % 256
      }
    }

    const imagePath = join(tempDir, 'source.png')
    await sharp(pixels, {
      raw: {
        width,
        height,
        channels
      }
    })
      .png()
      .toFile(imagePath)

    const imageStat = await stat(imagePath)

    return {
      id: 'item-1',
      name: 'source.png',
      sourcePath: imagePath,
      size: imageStat.size,
      detectedFormat: 'png',
      status: 'pending'
    }
  }
})
