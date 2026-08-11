import { TARGET_FORMATS, type TargetFormat } from './types'

export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const

const EXTENSION_TO_FORMAT: Record<string, TargetFormat> = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.gif': 'gif',
  '.webp': 'webp'
}

const FORMAT_TO_EXTENSION: Record<TargetFormat, string> = {
  jpeg: '.jpg',
  png: '.png',
  gif: '.gif',
  webp: '.webp'
}

const QUALITY_ADJUSTABLE_FORMATS = new Set<TargetFormat>(['jpeg', 'webp'])

export function getFileExtension(filePathOrName: string): string {
  const normalized = filePathOrName.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() ?? normalized
  const dotIndex = fileName.lastIndexOf('.')

  if (dotIndex <= 0) {
    return ''
  }

  return fileName.slice(dotIndex).toLowerCase()
}

export function normalizeImageFormat(filePathOrName: string): TargetFormat | null {
  return EXTENSION_TO_FORMAT[getFileExtension(filePathOrName)] ?? null
}

export function isSupportedImagePath(filePathOrName: string): boolean {
  return normalizeImageFormat(filePathOrName) !== null
}

export function getOutputExtension(targetFormat: TargetFormat): string {
  return FORMAT_TO_EXTENSION[targetFormat]
}

export function isTargetFormat(value: string): value is TargetFormat {
  return TARGET_FORMATS.includes(value as TargetFormat)
}

export function supportsQualityOption(targetFormat: TargetFormat): boolean {
  return QUALITY_ADJUSTABLE_FORMATS.has(targetFormat)
}
