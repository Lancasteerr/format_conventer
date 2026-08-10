import type { ConversionStrategy, TargetFormat } from '@shared/types'

const ANIMATED_FORMATS = new Set<TargetFormat>(['gif', 'webp'])

export function getConversionStrategy(
  sourceFormat: TargetFormat,
  targetFormat: TargetFormat,
  pageCount: number
): ConversionStrategy {
  const sourceMayBeAnimated = ANIMATED_FORMATS.has(sourceFormat)
  const targetCanAnimate = ANIMATED_FORMATS.has(targetFormat)
  const hasMultipleFrames = pageCount > 1

  return {
    readAnimatedInput: sourceMayBeAnimated && targetCanAnimate && hasMultipleFrames,
    preserveAnimation: sourceMayBeAnimated && targetCanAnimate && hasMultipleFrames,
    useFirstFrameOnly: sourceMayBeAnimated && !targetCanAnimate && hasMultipleFrames
  }
}
