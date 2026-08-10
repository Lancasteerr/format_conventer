import { useCallback, useState } from 'react'
import type { BatchItem } from '@shared/types'

export function useBatchItems(): {
  items: BatchItem[]
  addItems: (itemsToAdd: BatchItem[]) => void
  removeItem: (id: string) => void
  clearItems: () => void
  setItems: React.Dispatch<React.SetStateAction<BatchItem[]>>
  updateItem: (item: BatchItem) => void
} {
  const [items, setItems] = useState<BatchItem[]>([])

  const addItems = useCallback((itemsToAdd: BatchItem[]) => {
    setItems((currentItems) => {
      const existingPaths = new Set(currentItems.map((item) => item.sourcePath.toLowerCase()))
      const dedupedItems = itemsToAdd
        .filter((item) => item.sourcePath && !existingPaths.has(item.sourcePath.toLowerCase()))
        .map((item) => ({
          ...item,
          status: 'pending' as const,
          outputPath: undefined,
          error: undefined
        }))

      return [...currentItems, ...dedupedItems]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }, [])

  const clearItems = useCallback(() => {
    setItems([])
  }, [])

  const updateItem = useCallback((item: BatchItem) => {
    setItems((currentItems) =>
      currentItems.map((currentItem) => (currentItem.id === item.id ? item : currentItem))
    )
  }, [])

  return {
    items,
    addItems,
    removeItem,
    clearItems,
    setItems,
    updateItem
  }
}
