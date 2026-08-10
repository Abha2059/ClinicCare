import { Star } from 'lucide-react'
import { cn } from '../../utils/helpers'

const SIZES = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' }

/**
 * Read-only star rating. Renders partial fill via a clipped overlay so a
 * 4.3 reads accurately rather than rounding to 4.
 */
export default function Rating({ value = 0, count, size = 'md', showValue = true, className }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0))
  const starClass = SIZES[size] || SIZES.md

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className="relative inline-flex"
        role="img"
        aria-label={`Rated ${rating.toFixed(1)} out of 5`}
      >
        <span className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn(starClass, 'text-ink-200')} fill="currentColor" aria-hidden="true" />
          ))}
        </span>
        <span
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${(rating / 5) * 100}%` }}
          aria-hidden="true"
        >
          <span className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn(starClass, 'text-amber-400')} fill="currentColor" />
            ))}
          </span>
        </span>
      </span>

      {showValue && (
        <span className="text-sm font-semibold text-ink-800">
          {rating.toFixed(1)}
          {typeof count === 'number' && (
            <span className="ml-1 font-normal text-ink-400">({count})</span>
          )}
        </span>
      )}
    </span>
  )
}

/** Interactive star input used by the review form. */
export function RatingInput({ value = 0, onChange, name = 'rating', error }) {
  return (
    <div
      className="inline-flex items-center gap-1"
      role="radiogroup"
      aria-label="Your rating"
      aria-invalid={error ? 'true' : undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          name={name}
          onClick={() => onChange?.(star)}
          className="rounded-md p-0.5 transition hover:scale-110"
        >
          <Star
            className={cn('h-7 w-7', star <= value ? 'text-amber-400' : 'text-ink-200')}
            fill="currentColor"
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  )
}
