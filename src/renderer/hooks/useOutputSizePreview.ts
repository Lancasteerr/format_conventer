import { useEffect, useRef, useState } from 'react'
import { supportsQualityOption } from '@shared/formats'
import type { BatchItem, OutputSizePreviewResult, TargetFormat } from '@shared/types'

export interface OutputSizePreviewState {
  status: 'loading' | 'estimated' | 'unavailable' | 'error'
  outputSize?: number
  unavailableReason?: string
  error?: string
}

export type OutputSizePreviewById = Record<string, OutputSizePreviewState>

const PREVIEW_DEBOUNCE_MS = 300

export function useOutputSizePreview(
  items: BatchItem[],
  targetFormat: TargetFormat,
  quality: number,
  isPaused: boolean
): OutputSizePreviewById {
  const [previews, setPreviews] = useState<OutputSizePreviewById>({})
  const requestIdRef = useRef(0)

  useEffect(() => {
    requestIdRef.current += 1
    const requestId = requestIdRef.current

    if (items.length === 0) {
      setPreviews({})
      return
    }

    if (isPaused) {
      return
    }

    if (!supportsQualityOption(targetFormat)) {
      setPreviews(
        Object.fromEntries(
          items.map((item) => [
            item.id,
            {
              status: 'unavailable',
              unavailableReason: '质量不适用'
            } satisfies OutputSizePreviewState
          ])
        )
      )
      return
    }

    setPreviews(
      Object.fromEntries(
        items.map((item) => [
          item.id,
          {
            status: 'loading'
          } satisfies OutputSizePreviewState
        ])
      )
    )

    const timer = window.setTimeout(async () => {
      try {
        const previewOutputSizes = window.imageConverter.previewOutputSizes

        if (typeof previewOutputSizes !== 'function') {
          throw new Error('previewOutputSizes is not a function')
        }

        const results = await previewOutputSizes(items, {
          targetFormat,
          quality
        })

        if (requestIdRef.current !== requestId) {
          return
        }

        setPreviews(mapPreviewResults(results))
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return
        }

        const message = getPreviewRequestErrorMessage(error)

        setPreviews(
          Object.fromEntries(
            items.map((item) => [
              item.id,
              {
                status: 'error',
                error: message
              } satisfies OutputSizePreviewState
            ])
          )
        )
      }
    }, PREVIEW_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [items, targetFormat, quality, isPaused])

  return previews
}

export function getPreviewRequestErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (/previewOutputSizes is not a function|No handler registered.*preview-output-sizes/i.test(message)) {
    return '请重启应用加载预览接口'
  }

  return message || '预览失败'
}

function mapPreviewResults(results: OutputSizePreviewResult[]): OutputSizePreviewById {
  return Object.fromEntries(
    results.map((result) => {
      if (typeof result.outputSize === 'number') {
        return [
          result.id,
          {
            status: 'estimated',
            outputSize: result.outputSize
          } satisfies OutputSizePreviewState
        ]
      }

      if (result.unavailableReason) {
        return [
          result.id,
          {
            status: 'unavailable',
            unavailableReason: result.unavailableReason
          } satisfies OutputSizePreviewState
        ]
      }

      return [
        result.id,
        {
          status: 'error',
          error: result.error ?? '预览失败'
        } satisfies OutputSizePreviewState
      ]
    })
  )
}
