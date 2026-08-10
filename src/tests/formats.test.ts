import { describe, expect, it } from 'vitest'
import { getOutputExtension, isSupportedImagePath, normalizeImageFormat } from '@shared/formats'

describe('formats', () => {
  it('normalizes supported image extensions', () => {
    expect(normalizeImageFormat('photo.JPG')).toBe('jpeg')
    expect(normalizeImageFormat('photo.jpeg')).toBe('jpeg')
    expect(normalizeImageFormat('photo.png')).toBe('png')
    expect(normalizeImageFormat('photo.GIF')).toBe('gif')
    expect(normalizeImageFormat('photo.webp')).toBe('webp')
  })

  it('rejects unsupported paths', () => {
    expect(isSupportedImagePath('notes.txt')).toBe(false)
    expect(isSupportedImagePath('archive')).toBe(false)
  })

  it('uses jpg as jpeg output extension', () => {
    expect(getOutputExtension('jpeg')).toBe('.jpg')
    expect(getOutputExtension('png')).toBe('.png')
    expect(getOutputExtension('gif')).toBe('.gif')
    expect(getOutputExtension('webp')).toBe('.webp')
  })
})
