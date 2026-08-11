import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, X } from 'lucide-react'
import { supportsQualityOption } from '@shared/formats'
import { normalizeQuality } from '@shared/quality'
import type { OutputSizePreviewById } from '@renderer/hooks/useOutputSizePreview'
import type { BatchItem, BatchStatus, TargetFormat } from '@shared/types'
import { formatBytes } from '@renderer/utils/formatBytes'

interface FileTableProps {
  items: BatchItem[]
  targetFormat: TargetFormat
  quality: number
  outputSizePreviews: OutputSizePreviewById
  disabled: boolean
  onRemoveItem: (id: string) => void
}

const STATUS_LABELS: Record<BatchStatus, string> = {
  pending: '等待',
  converting: '转换中',
  success: '完成',
  error: '失败'
}

export function FileTable({
  items,
  targetFormat,
  quality,
  outputSizePreviews,
  disabled,
  onRemoveItem
}: FileTableProps): JSX.Element {
  if (items.length === 0) {
    return <section className="empty-state">还没有图片，先选择或拖入一些文件。</section>
  }

  return (
    <section className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>文件名</th>
            <th>格式</th>
            <th>大小</th>
            <th>输出大小</th>
            <th>状态</th>
            <th>输出 / 错误</th>
            <th aria-label="操作" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="name-cell" title={item.sourcePath}>
                {item.name}
              </td>
              <td>{item.detectedFormat.toUpperCase()}</td>
              <td>{formatBytes(item.size)}</td>
              <td>
                <OutputSizeCell
                  item={item}
                  targetFormat={targetFormat}
                  quality={quality}
                  preview={outputSizePreviews[item.id]}
                />
              </td>
              <td>
                <StatusBadge status={item.status} />
              </td>
              <td className={item.status === 'error' ? 'error-cell' : 'path-cell'}>
                {item.error || item.outputPath || '-'}
              </td>
              <td className="action-cell">
                <button
                  className="icon-button small"
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemoveItem(item.id)}
                  title="移除"
                >
                  <X size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function OutputSizeCell({
  item,
  targetFormat,
  quality,
  preview
}: {
  item: BatchItem
  targetFormat: TargetFormat
  quality: number
  preview?: OutputSizePreviewById[string]
}): JSX.Element {
  if (hasFreshActualOutput(item, targetFormat, quality)) {
    return <OutputSizeValue label="实际" outputSize={item.outputSize} sourceSize={item.size} />
  }

  if (!supportsQualityOption(targetFormat)) {
    return <span className="size-preview muted">质量不适用</span>
  }

  if (!preview || preview.status === 'loading') {
    return <span className="size-preview muted">计算中</span>
  }

  if (preview.status === 'estimated' && typeof preview.outputSize === 'number') {
    return <OutputSizeValue label="预计" outputSize={preview.outputSize} sourceSize={item.size} />
  }

  if (preview.status === 'unavailable') {
    return <span className="size-preview muted">{preview.unavailableReason ?? '质量不适用'}</span>
  }

  return (
    <span className="size-preview error" title={preview.error ?? '预览失败'}>
      预览失败
    </span>
  )
}

function OutputSizeValue({
  label,
  outputSize,
  sourceSize
}: {
  label: '预计' | '实际'
  outputSize: number | undefined
  sourceSize: number
}): JSX.Element {
  if (typeof outputSize !== 'number') {
    return <span className="size-preview muted">-</span>
  }

  const delta = getSizeDelta(outputSize, sourceSize)

  return (
    <span className="size-preview">
      <span>
        {label} {formatBytes(outputSize)}
      </span>
      {delta ? <small className={delta.className}>{delta.label}</small> : null}
    </span>
  )
}

function hasFreshActualOutput(item: BatchItem, targetFormat: TargetFormat, quality: number): boolean {
  if (item.status !== 'success' || typeof item.outputSize !== 'number') {
    return false
  }

  if (item.outputFormat !== targetFormat) {
    return false
  }

  return !supportsQualityOption(targetFormat) || item.outputQuality === normalizeQuality(quality)
}

function getSizeDelta(
  outputSize: number,
  sourceSize: number
): { label: string; className: string } | null {
  if (sourceSize <= 0) {
    return null
  }

  const ratio = (outputSize - sourceSize) / sourceSize
  const percentage = Math.round(Math.abs(ratio) * 100)

  if (percentage === 0) {
    return {
      label: '基本持平',
      className: 'same'
    }
  }

  return ratio < 0
    ? {
        label: `压缩 ${percentage}%`,
        className: 'reduced'
      }
    : {
        label: `增大 ${percentage}%`,
        className: 'increased'
      }
}

function StatusBadge({ status }: { status: BatchStatus }): JSX.Element {
  const icon = {
    pending: <Clock3 size={15} />,
    converting: <LoaderCircle className="spin" size={15} />,
    success: <CheckCircle2 size={15} />,
    error: <AlertCircle size={15} />
  }[status]

  return (
    <span className={`status-badge ${status}`}>
      {icon}
      {STATUS_LABELS[status]}
    </span>
  )
}
