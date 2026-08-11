export const DEFAULT_QUALITY = 85

export function normalizeQuality(quality: number | undefined): number {
  if (typeof quality !== 'number' || Number.isNaN(quality)) {
    return DEFAULT_QUALITY
  }

  return Math.min(100, Math.max(1, Math.round(quality)))
}
