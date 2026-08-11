import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1160,
    height: 760,
    minWidth: 900,
    minHeight: 620,
    title: 'Format conventer',
    backgroundColor: '#f6f7f9',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    loadDevRenderer(window, process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

function loadDevRenderer(window: BrowserWindow, rendererUrl: string): void {
  let retryCount = 0
  const maxRetries = 10

  const load = (): void => {
    window.loadURL(rendererUrl).catch(() => {
      if (retryCount >= maxRetries || window.isDestroyed()) {
        return
      }

      retryCount += 1
      /*
       * 开发模式下 Vite 服务和 Electron 窗口几乎同时启动。
       * 如果窗口先请求到 localhost，偶尔会遇到连接拒绝，这里短暂重试即可。
       */
      setTimeout(load, 500)
    })
  }

  load()
}
