import { useMemo, useState } from 'react'
import { TARGET_FORMATS, type TargetFormat } from '@shared/types'
import { DropZone } from './components/DropZone'
import { FileTable } from './components/FileTable'
import { ProgressBar } from './components/ProgressBar'
import { Toolbar } from './components/Toolbar'
import { useBatchItems } from './hooks/useBatchItems'
import { useConversion } from './hooks/useConversion'
import { createBatchItemsFromDroppedFiles } from './utils/createDroppedItems'

const DEFAULT_TARGET_FORMAT: TargetFormat = 'webp'
const DEFAULT_QUALITY = 85

export function App(): JSX.Element {
  const [targetFormat, setTargetFormat] = useState<TargetFormat>(DEFAULT_TARGET_FORMAT)
  const [quality, setQuality] = useState(DEFAULT_QUALITY)
  const [outputDir, setOutputDir] = useState<string>('')
  const { items, addItems, removeItem, clearItems, setItems, updateItem } = useBatchItems()
  const { convertItems, isConverting, progress, error } = useConversion(setItems, updateItem)

  const canConvert = items.length > 0 && outputDir.length > 0 && !isConverting
  const progressLabel = useMemo(() => {
    if (progress.total === 0) {
      return '等待转换'
    }

    return `${progress.completed} / ${progress.total}`
  }, [progress])

  async function handleSelectImages(): Promise<void> {
    const selectedItems = await window.imageConverter.selectImages()
    addItems(selectedItems)
  }

  async function handleSelectOutputDir(): Promise<void> {
    const selectedOutputDir = await window.imageConverter.selectOutputDir()

    if (selectedOutputDir) {
      setOutputDir(selectedOutputDir)
    }
  }

  function handleDroppedFiles(files: FileList, filePaths: string[]): void {
    addItems(createBatchItemsFromDroppedFiles(files, filePaths))
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
          {error ? <span className="status-error">{error}</span> : null}
        </div>

        <FileTable items={items} disabled={isConverting} onRemoveItem={removeItem} />
      </section>
    </main>
  )
}
