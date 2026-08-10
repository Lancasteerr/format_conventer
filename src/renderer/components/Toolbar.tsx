import { FolderOpen, FolderOutput, Play, SlidersHorizontal, Trash2 } from 'lucide-react'
import type { TargetFormat } from '@shared/types'

interface ToolbarProps {
  targetFormats: readonly TargetFormat[]
  targetFormat: TargetFormat
  quality: number
  outputDir: string
  canConvert: boolean
  isConverting: boolean
  onTargetFormatChange: (format: TargetFormat) => void
  onQualityChange: (quality: number) => void
  onSelectImages: () => void
  onSelectOutputDir: () => void
  onStartConversion: () => void
  onClearItems: () => void
}

const FORMAT_LABELS: Record<TargetFormat, string> = {
  jpeg: 'JPG',
  png: 'PNG',
  gif: 'GIF',
  webp: 'WEBP'
}

export function Toolbar({
  targetFormats,
  targetFormat,
  quality,
  outputDir,
  canConvert,
  isConverting,
  onTargetFormatChange,
  onQualityChange,
  onSelectImages,
  onSelectOutputDir,
  onStartConversion,
  onClearItems
}: ToolbarProps): JSX.Element {
  return (
    <header className="toolbar">
      <div className="toolbar-main">
        <button className="button primary" type="button" onClick={onSelectImages} title="选择图片">
          <FolderOpen size={18} />
          选择图片
        </button>

        <button className="button" type="button" onClick={onSelectOutputDir} title="选择输出目录">
          <FolderOutput size={18} />
          输出目录
        </button>

        <label className="field">
          <span>目标格式</span>
          <select
            value={targetFormat}
            onChange={(event) => onTargetFormatChange(event.target.value as TargetFormat)}
          >
            {targetFormats.map((format) => (
              <option key={format} value={format}>
                {FORMAT_LABELS[format]}
              </option>
            ))}
          </select>
        </label>

        <label className="field quality-field">
          <span>
            <SlidersHorizontal size={16} />
            质量 {quality}
          </span>
          <input
            type="range"
            min="1"
            max="100"
            value={quality}
            onChange={(event) => onQualityChange(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="toolbar-actions">
        <button className="icon-button" type="button" onClick={onClearItems} title="清空列表">
          <Trash2 size={18} />
        </button>
        <button
          className="button accent"
          type="button"
          disabled={!canConvert}
          onClick={onStartConversion}
          title="开始转换"
        >
          <Play size={18} />
          {isConverting ? '转换中' : '开始转换'}
        </button>
      </div>

      <div className="output-path" title={outputDir || '尚未选择输出目录'}>
        {outputDir || '尚未选择输出目录'}
      </div>
    </header>
  )
}
