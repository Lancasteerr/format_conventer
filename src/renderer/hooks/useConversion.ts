import { useCallback, useEffect, useState } from 'react'
import type { BatchItem, ConvertOptions } from '@shared/types'

interface ProgressState {
  completed: number
  total: number
}

export function useConversion(
  setItems: React.Dispatch<React.SetStateAction<BatchItem[]>>,
  updateItem: (item: BatchItem) => void
): {
  convertItems: (items: BatchItem[], options: ConvertOptions) => Promise<void>
  isConverting: boolean
  progress: ProgressState
  error: string | null
} {
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState<ProgressState>({ completed: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return window.imageConverter.onConversionProgress((event) => {
      updateItem(event.item)
      setProgress({ completed: event.completed, total: event.total })
    })
  }, [updateItem])

  const convertItems = useCallback(
    async (items: BatchItem[], options: ConvertOptions) => {
      setIsConverting(true)
      setError(null)
      setProgress({ completed: 0, total: items.length })
      setItems((currentItems) =>
        currentItems.map((item) => ({
          ...item,
          status: 'pending',
          outputPath: undefined,
          error: undefined
        }))
      )

      try {
        const results = await window.imageConverter.convertBatch(items, options)
        setItems(results)
        setProgress({ completed: results.length, total: results.length })
      } catch (conversionError) {
        setError(conversionError instanceof Error ? conversionError.message : '批量转换失败')
      } finally {
        setIsConverting(false)
      }
    },
    [setItems]
  )

  return {
    convertItems,
    isConverting,
    progress,
    error
  }
}
