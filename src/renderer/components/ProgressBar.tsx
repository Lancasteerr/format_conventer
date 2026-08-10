interface ProgressBarProps {
  completed: number
  total: number
  label: string
}

export function ProgressBar({ completed, total, label }: ProgressBarProps): JSX.Element {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="progress-shell" aria-label="转换进度">
      <div className="progress-meta">
        <span>总进度</span>
        <span>{label}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
