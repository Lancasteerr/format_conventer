import type { ImageConverterApi } from '@shared/api'

declare global {
  interface Window {
    imageConverter: ImageConverterApi
  }
}

export {}
