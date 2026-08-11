import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ImageFileService } from '@main/services/imageFileService'

describe('ImageFileService', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'image-file-service-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('creates batch items for supported image file paths', async () => {
    const imagePath = join(tempDir, 'photo.PNG')
    await writeFile(imagePath, 'image bytes')

    const [item] = await new ImageFileService().createBatchItems([imagePath])

    expect(item).toMatchObject({
      name: 'photo.PNG',
      sourcePath: resolve(imagePath),
      size: 11,
      detectedFormat: 'png',
      status: 'pending'
    })
    expect(item?.id).toEqual(expect.any(String))
  })

  it('filters duplicates, unsupported files, missing paths, and directories', async () => {
    const imagePath = join(tempDir, 'photo.jpg')
    const unsupportedPath = join(tempDir, 'notes.txt')
    const directoryPath = join(tempDir, 'folder.png')
    const missingPath = join(tempDir, 'missing.webp')

    await writeFile(imagePath, 'jpg')
    await writeFile(unsupportedPath, 'txt')
    await mkdir(directoryPath)

    const items = await new ImageFileService().createBatchItems([
      imagePath,
      imagePath,
      unsupportedPath,
      directoryPath,
      missingPath
    ])

    expect(items).toHaveLength(1)
    expect(items[0].sourcePath).toBe(resolve(imagePath))
  })
})
