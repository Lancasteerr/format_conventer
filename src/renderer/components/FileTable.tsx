import { AlertCircle, CheckCircle2, Clock3, LoaderCircle, X } from 'lucide-react'
import type { BatchItem, BatchStatus } from '@shared/types'
import { formatBytes } from '@renderer/utils/formatBytes'

interface FileTableProps {
  items: BatchItem[]
  disabled: boolean
  onRemoveItem: (id: string) => void
}

const STATUS_LABELS: Record<BatchStatus, string> = {
  pending: '等待',
  converting: '转换中',
  success: '完成',
  error: '失败'
}

export function FileTable({ items, disabled, onRemoveItem }: FileTableProps): JSX.Element {
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
