import { existsSync } from 'node:fs'
import { join, parse } from 'node:path'
import { getOutputExtension } from '@shared/formats'
import type { TargetFormat } from '@shared/types'

type ExistsPredicate = (filePath: string) => boolean

export function createAvailableOutputPath(
  sourcePath: string,
  outputDir: string,
  targetFormat: TargetFormat,
  exists: ExistsPredicate = existsSync
): string {
  const parsed = parse(sourcePath)
  const extension = getOutputExtension(targetFormat)
  const originalCandidate = join(outputDir, `${parsed.name}${extension}`)

  if (!exists(originalCandidate)) {
    return originalCandidate
  }

  /*
   * 防覆盖命名：无论冲突来自源文件还是已有导出文件，都从 -converted 开始递增，
   * 这样不会悄悄改写用户原图。
   */
  for (let index = 1; index < 10000; index += 1) {
    const suffix = index === 1 ? '-converted' : `-converted-${index}`
    const candidate = join(outputDir, `${parsed.name}${suffix}${extension}`)

    if (!exists(candidate)) {
      return candidate
    }
  }

  throw new Error('无法生成可用的输出文件名')
}
