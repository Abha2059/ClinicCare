import { cn } from '../../utils/helpers'

const TONES = {
  brand: 'bg-brand-50 text-brand-700',
  info: 'bg-sky-50 text-sky-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  neutral: 'bg-ink-100 text-ink-700',
}

/** Metric tile used across all three dashboards. */
export default function StatCard({ label, value, icon: Icon, tone = 'brand', hint, loading = false }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-500">{label}</p>
          {loading ? (
            <div className="skeleton mt-2 h-8 w-16" aria-hidden="true" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-ink-900 sm:text-3xl">{value ?? 0}</p>
          )}
          {hint && !loading && <p className="mt-1 truncate text-xs text-ink-400">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  )
}
