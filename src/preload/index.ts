import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { ImageConverterApi } from '@shared/api'
import { IPC_CHANNELS } from '@shared/ipc'
import type {
  BatchItem,
  ConversionProgressEvent,
  ConvertOptions,
  OutputSizePreviewOptions
} from '@shared/types'

const api: ImageConverterApi = {
  selectImages: () => ipcRenderer.invoke(IPC_CHANNELS.selectImages),
  selectOutputDir: () => ipcRenderer.invoke(IPC_CHANNELS.selectOutputDir),
  getDroppedFilePaths: (files) => {
    return Array.from(files)
      .map((file) => webUtils.getPathForFile(file))
      .filter((filePath) => filePath.length > 0)
  },
  createBatchItemsFromPaths: (filePaths: string[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.createBatchItemsFromPaths, filePaths),
  previewOutputSizes: (items: BatchItem[], options: OutputSizePreviewOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.previewOutputSizes, items, options),
  convertBatch: (items: BatchItem[], options: ConvertOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.convertBatch, items, options),
  onConversionProgress: (callback: (event: ConversionProgressEvent) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: ConversionProgressEvent) => {
      callback(payload)
    }

    ipcRenderer.on(IPC_CHANNELS.conversionProgress, listener)

    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.conversionProgress, listener)
    }
  }
}

/*
 * preload 只暴露白名单能力。渲染进程不能直接访问 Node，
 * 所有涉及本机文件系统的动作都通过主进程 IPC 完成。
 */
contextBridge.exposeInMainWorld('imageConverter', api)
