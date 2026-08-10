import { cn } from '../../utils/helpers'

/**
 * Dependency-free bar chart for dashboard trends.
 * data: [{ label, value }]
 */
export default function MiniBarChart({ data = [], className, barClass = 'bg-brand-500' }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0))

  if (data.length === 0) return null

  return (
    <div className={cn('w-full', className)}>
      <div className="flex h-40 items-end gap-2" role="img" aria-label="Appointments per month">
        {data.map((d) => {
          const value = Number(d.value) || 0
          const heightPct = Math.max(4, (value / max) * 100)
          return (
            <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-2">
              <span className="text-xs font-semibold text-ink-700">{value}</span>
              <div
                className={cn('w-full rounded-t-lg transition-all', barClass)}
                style={{ height: `${heightPct}%` }}
                title={`${d.label}: ${value}`}
              />
              <span className="truncate text-[11px] text-ink-500">{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
