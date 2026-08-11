import { dialog, ipcMain, type BrowserWindow } from 'electron'
import type { OpenDialogOptions } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc'
import { isTargetFormat } from '@shared/formats'
import type { BatchItem, ConvertOptions, OutputSizePreviewOptions, OutputSizePreviewResult } from '@shared/types'
import { ImageConversionService } from '@main/services/imageConversionService'
import { ImageFileService } from '@main/services/imageFileService'

const imageFileService = new ImageFileService()
const imageConversionService = new ImageConversionService()

export function registerImageConverterIpc(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle(IPC_CHANNELS.selectImages, async () => {
    const mainWindow = getMainWindow()
    const options: OpenDialogOptions = {
      title: '选择图片',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: '图片文件',
          extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
        }
      ]
    }
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled) {
      return []
    }

    return imageFileService.createBatchItems(result.filePaths)
  })

  ipcMain.handle(IPC_CHANNELS.selectOutputDir, async () => {
    const mainWindow = getMainWindow()
    const options: OpenDialogOptions = {
      title: '选择输出目录',
      properties: ['openDirectory', 'createDirectory']
    }
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options)

    return result.canceled ? null : result.filePaths[0] ?? null
  })

  ipcMain.handle(
    IPC_CHANNELS.createBatchItemsFromPaths,
    async (_event, filePaths: unknown): Promise<BatchItem[]> => {
      validateFilePaths(filePaths)

      return imageFileService.createBatchItems(filePaths)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.previewOutputSizes,
    async (
      _event,
      items: BatchItem[],
      options: OutputSizePreviewOptions
    ): Promise<OutputSizePreviewResult[]> => {
      validatePreviewRequest(items, options)

      return imageConversionService.previewOutputSizes(items, options)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.convertBatch,
    async (event, items: BatchItem[], options: ConvertOptions): Promise<BatchItem[]> => {
      validateConvertRequest(items, options)

      /*
       * IPC 是渲染层和本机文件系统之间的安全边界：
       * 这里统一校验参数，再把真实转换交给服务层，避免 UI 直接接触 Node API。
       */
      return imageConversionService.convertBatch(items, options, (progress) => {
        event.sender.send(IPC_CHANNELS.conversionProgress, progress)
      })
    }
  )
}

function validateFilePaths(filePaths: unknown): asserts filePaths is string[] {
  if (!Array.isArray(filePaths) || !filePaths.every((filePath) => typeof filePath === 'string')) {
    throw new Error('导入文件路径无效')
  }
}

function validateConvertRequest(items: BatchItem[], options: ConvertOptions): void {
  if (!Array.isArray(items)) {
    throw new Error('转换列表无效')
  }

  if (!options?.outputDir) {
    throw new Error('请先选择输出目录')
  }

  if (!isTargetFormat(options.targetFormat)) {
    throw new Error('目标格式无效')
  }
}

function validatePreviewRequest(items: BatchItem[], options: OutputSizePreviewOptions): void {
  if (!Array.isArray(items)) {
    throw new Error('预览列表无效')
  }

  if (!isTargetFormat(options?.targetFormat)) {
    throw new Error('目标格式无效')
  }
}
