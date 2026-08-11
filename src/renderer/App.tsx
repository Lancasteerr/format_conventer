import { useMemo, useState } from 'react'
import { TARGET_FORMATS, type TargetFormat } from '@shared/types'
import { DropZone } from './components/DropZone'
import { FileTable } from './components/FileTable'
import { ProgressBar } from './components/ProgressBar'
import { Toolbar } from './components/Toolbar'
import { useBatchItems } from './hooks/useBatchItems'
import { useConversion } from './hooks/useConversion'
import { useOutputSizePreview } from './hooks/useOutputSizePreview'
import { createDroppedImportResult } from './utils/createDroppedImportResult'
import { DEFAULT_QUALITY } from '@shared/quality'

const DEFAULT_TARGET_FORMAT: TargetFormat = 'webp'

export function App(): JSX.Element {
  const [targetFormat, setTargetFormat] = useState<TargetFormat>(DEFAULT_TARGET_FORMAT)
  const [quality, setQuality] = useState(DEFAULT_QUALITY)
  const [outputDir, setOutputDir] = useState<string>('')
  const [importError, setImportError] = useState<string | null>(null)
  const { items, addItems, removeItem, clearItems, setItems, updateItem } = useBatchItems()
  const { convertItems, isConverting, progress, error } = useConversion(setItems, updateItem)
  const outputSizePreviews = useOutputSizePreview(items, targetFormat, quality, isConverting)
  const statusError = error || importError

  const canConvert = items.length > 0 && outputDir.length > 0 && !isConverting
  const progressLabel = useMemo(() => {
    if (progress.total === 0) {
      return '等待转换'
    }

    return `${progress.completed} / ${progress.total}`
  }, [progress])

  async function handleSelectImages(): Promise<void> {
    const selectedItems = await window.imageConverter.selectImages()
    setImportError(null)
    addItems(selectedItems)
  }

  async function handleSelectOutputDir(): Promise<void> {
    const selectedOutputDir = await window.imageConverter.selectOutputDir()

    if (selectedOutputDir) {
      setOutputDir(selectedOutputDir)
    }
  }

  async function handleDroppedFiles(filePaths: string[]): Promise<void> {
    try {
      const result = await createDroppedImportResult(
        filePaths,
        window.imageConverter.createBatchItemsFromPaths
      )

      setImportError(result.error)
      addItems(result.items)
    } catch (importFailure) {
      setImportError(importFailure instanceof Error ? importFailure.message : '导入文件失败')
    }
  }

  async function handleStartConversion(): Promise<void> {
    if (!canConvert) {
      return
    }

    await convertItems(items, {
      targetFormat,
      outputDir,
      quality
    })
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <Toolbar
          targetFormats={TARGET_FORMATS}
          targetFormat={targetFormat}
          quality={quality}
          outputDir={outputDir}
          canConvert={canConvert}
          isConverting={isConverting}
          onTargetFormatChange={setTargetFormat}
          onQualityChange={setQuality}
          onSelectImages={handleSelectImages}
          onSelectOutputDir={handleSelectOutputDir}
          onStartConversion={handleStartConversion}
          onClearItems={clearItems}
        />

        <DropZone disabled={isConverting} onDropFiles={handleDroppedFiles} />

        <div className="status-row">
          <ProgressBar completed={progress.completed} total={progress.total} label={progressLabel} />
          {statusError ? <span className="status-error">{statusError}</span> : null}
        </div>

        <FileTable
          items={items}
          targetFormat={targetFormat}
          quality={quality}
          outputSizePreviews={outputSizePreviews}
          disabled={isConverting}
          onRemoveItem={removeItem}
        />
      </section>
    </main>
  )
}
