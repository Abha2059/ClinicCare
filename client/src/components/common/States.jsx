import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react'
import Button from './Button'
import { cn } from '../../utils/helpers'

/** Inline spinner for buttons, panels and lazy boundaries. */
export function Spinner({ className, label = 'Loading' }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
      <Loader2 className={cn('h-5 w-5 animate-spin text-brand-600', className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Full-section loading state. */
export function LoadingState({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
      <p className="text-sm font-medium text-ink-500" role="status" aria-live="polite">
        {label}
      </p>
    </div>
  )
}

/** Error state with an optional retry action. */
export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="max-w-md text-sm text-ink-600">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-1">
          Try again
        </Button>
      )}
    </div>
  )
}

/** Empty state for lists with no results. */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  message = 'There is no data to display right now.',
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 px-6 py-14 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <Icon className="h-6 w-6 text-ink-400" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="max-w-md text-sm text-ink-600">{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

/** Skeleton block used while content loads. */
export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}

/** Skeleton shaped like a doctor card, for the directory grid. */
export function DoctorCardSkeleton() {
  return (
    <div className="card card-body" aria-hidden="true">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="mt-5 flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

/** Skeleton rows for dashboard tables. */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2 p-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-9 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
