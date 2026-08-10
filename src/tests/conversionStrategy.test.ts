import { describe, expect, it } from 'vitest'
import { getConversionStrategy } from '@main/services/conversionStrategy'

describe('getConversionStrategy', () => {
  it('preserves animation for gif to webp when multiple pages exist', () => {
    expect(getConversionStrategy('gif', 'webp', 8)).toEqual({
      readAnimatedInput: true,
      preserveAnimation: true,
      useFirstFrameOnly: false
    })
  })

  it('uses the first frame when animated source is converted to png', () => {
    expect(getConversionStrategy('webp', 'png', 5)).toEqual({
      readAnimatedInput: false,
      preserveAnimation: false,
      useFirstFrameOnly: true
    })
  })

  it('does not mark static images as animated conversions', () => {
    expect(getConversionStrategy('png', 'gif', 1)).toEqual({
      readAnimatedInput: false,
      preserveAnimation: false,
      useFirstFrameOnly: false
    })
  })
})
