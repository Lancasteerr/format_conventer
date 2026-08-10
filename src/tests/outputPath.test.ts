import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createAvailableOutputPath } from '@main/utils/outputPath'

describe('createAvailableOutputPath', () => {
  const outputDir = 'C:\\exports'

  it('uses the plain target extension when no file conflicts', () => {
    const result = createAvailableOutputPath('C:\\images\\summer.png', outputDir, 'webp', () => false)

    expect(result).toBe(join(outputDir, 'summer.webp'))
  })

  it('adds converted suffix when the first output path exists', () => {
    const existing = new Set([join(outputDir, 'summer.jpg')])
    const result = createAvailableOutputPath('C:\\images\\summer.jpeg', outputDir, 'jpeg', (filePath) =>
      existing.has(filePath)
    )

    expect(result).toBe(join(outputDir, 'summer-converted.jpg'))
  })

  it('increments converted suffix until an available name is found', () => {
    const existing = new Set([
      join(outputDir, 'summer.webp'),
      join(outputDir, 'summer-converted.webp'),
      join(outputDir, 'summer-converted-2.webp')
    ])
    const result = createAvailableOutputPath('C:\\images\\summer.png', outputDir, 'webp', (filePath) =>
      existing.has(filePath)
    )

    expect(result).toBe(join(outputDir, 'summer-converted-3.webp'))
  })
})
