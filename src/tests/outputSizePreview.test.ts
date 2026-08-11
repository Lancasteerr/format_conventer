import { describe, expect, it } from 'vitest'
import { getPreviewRequestErrorMessage } from '@renderer/hooks/useOutputSizePreview'

describe('getPreviewRequestErrorMessage', () => {
  it('asks the user to restart when the preload API is missing', () => {
    expect(getPreviewRequestErrorMessage(new Error('previewOutputSizes is not a function'))).toBe(
      '请重启应用加载预览接口'
    )
  })

  it('asks the user to restart when the main process handler is missing', () => {
    expect(
      getPreviewRequestErrorMessage(
        new Error('Error invoking remote method: Error: No handler registered for image-converter:preview-output-sizes')
      )
    ).toBe('请重启应用加载预览接口')
  })

  it('keeps other preview request errors visible', () => {
    expect(getPreviewRequestErrorMessage(new Error('磁盘读取失败'))).toBe('磁盘读取失败')
  })
})
