import { SlidersHorizontal, X } from 'lucide-react'
import { EXPERIENCE_FILTERS, RATING_FILTERS, SORT_OPTIONS } from '../../utils/constants'
import { cn } from '../../utils/helpers'

/**
 * Filter panel for the doctor directory.
 * Fully controlled — the parent owns filter state and URL syncing.
 */
export default function DoctorFilters({
  filters,
  specialties = [],
  onChange,
  onReset,
  activeCount = 0,
  className,
}) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value })

  return (
    <div className={cn('card', className)}>
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Filters
          {activeCount > 0 && <span className="badge-brand">{activeCount}</span>}
        </h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 transition hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4 px-5 py-5">
        <div>
          <label htmlFor="filter-specialty" className="label">
            Specialty
          </label>
          <select
            id="filter-specialty"
            value={filters.specialty || ''}
            onChange={set('specialty')}
            className="select"
          >
            <option value="">All specialties</option>
            {specialties.map((s) => (
              <option key={s._id || s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-experience" className="label">
            Experience
          </label>
          <select
            id="filter-experience"
            value={filters.minExperience || ''}
            onChange={set('minExperience')}
            className="select"
          >
            {EXPERIENCE_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-rating" className="label">
            Minimum rating
          </label>
          <select
            id="filter-rating"
            value={filters.minRating || ''}
            onChange={set('minRating')}
            className="select"
          >
            {RATING_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-fee" className="label">
            Maximum fee
            <span className="ml-1 font-normal text-ink-400">
              {filters.maxFee ? `— up to ₹${filters.maxFee}` : '— any'}
            </span>
          </label>
          <input
            id="filter-fee"
            type="range"
            min="200"
            max="3000"
            step="100"
            value={filters.maxFee || 3000}
            onChange={set('maxFee')}
            className="w-full accent-brand-600"
          />
          <div className="mt-1 flex justify-between text-xs text-ink-400">
            <span>₹200</span>
            <span>₹3000</span>
          </div>
        </div>

        <div>
          <label htmlFor="filter-sort" className="label">
            Sort by
          </label>
          <select id="filter-sort" value={filters.sort || 'rating'} onChange={set('sort')} className="select">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-2.5 border-t border-ink-100 pt-4">
          <input
            id="filter-available"
            type="checkbox"
            checked={Boolean(filters.availableOnly)}
            onChange={(e) => onChange({ ...filters, availableOnly: e.target.checked })}
            className="checkbox mt-0.5"
          />
          <label htmlFor="filter-available" className="text-sm text-ink-700">
            Accepting appointments
          </label>
        </div>
      </div>
    </div>
  )
}
