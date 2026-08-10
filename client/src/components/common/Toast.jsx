import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { cn } from '../../utils/helpers'

const TYPES = {
  success: { icon: CheckCircle2, bar: 'bg-emerald-500', iconColor: 'text-emerald-600' },
  error: { icon: AlertCircle, bar: 'bg-red-500', iconColor: 'text-red-600' },
  warning: { icon: TriangleAlert, bar: 'bg-amber-500', iconColor: 'text-amber-600' },
  info: { icon: Info, bar: 'bg-sky-500', iconColor: 'text-sky-600' },
}

/** Global toast viewport — mounted once in App. */
export default function ToastContainer() {
  const { toasts, dismissToast } = useApp()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:items-end"
    >
      {toasts.map((t) => {
        const meta = TYPES[t.type] || TYPES.info
        const Icon = meta.icon
        return (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm animate-slide-in-right overflow-hidden rounded-xl border border-ink-100 bg-white shadow-pop"
          >
            <span className={cn('w-1 shrink-0', meta.bar)} aria-hidden="true" />
            <div className="flex flex-1 items-start gap-3 p-3.5">
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', meta.iconColor)} aria-hidden="true" />
              <p className="flex-1 text-sm font-medium text-ink-800">{t.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
