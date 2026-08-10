import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '../../utils/helpers'

/** items: [{ label, to }] — the final item renders as the current page. */
export default function Breadcrumbs({ items = [], className }) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-6', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
        <li className="flex items-center gap-1.5">
          <Link to="/" className="inline-flex items-center gap-1.5 transition hover:text-brand-700">
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-ink-300" aria-hidden="true" />
              {isLast || !item.to ? (
                <span className="font-medium text-ink-800" aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="transition hover:text-brand-700">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
