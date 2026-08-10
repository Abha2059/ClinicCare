import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/helpers'

/** Build a compact page list with ellipses: 1 … 4 5 6 … 20 */
function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('start-ellipsis')
  for (let i = start; i <= end; i += 1) pages.push(i)
  if (end < total - 1) pages.push('end-ellipsis')
  pages.push(total)

  return pages
}

export default function Pagination({ page, totalPages, onChange, className }) {
  if (!totalPages || totalPages <= 1) return null

  const pages = buildPages(page, totalPages)
  const go = (p) => {
    if (p >= 1 && p <= totalPages && p !== page) onChange(p)
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1.5', className)}
    >
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-200 disabled:hover:bg-transparent disabled:hover:text-ink-600"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {pages.map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="px-1.5 text-sm text-ink-400" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => go(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition',
              p === page
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-ink-200 text-ink-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700',
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-200 disabled:hover:bg-transparent disabled:hover:text-ink-600"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
