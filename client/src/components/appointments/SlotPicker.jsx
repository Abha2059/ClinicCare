import { useMemo } from 'react'
import { CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react'
import { LoadingState, ErrorState } from '../common/States'
import { buildDateRange, cn, formatTime } from '../../utils/helpers'

const VISIBLE_DAYS = 7

/**
 * Date strip + time-slot grid.
 * Slots come from the server (`/doctors/:id/slots`) which is the single source
 * of truth for what is actually free — the UI only renders what it is told.
 */
export default function SlotPicker({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  slots = [],
  loading = false,
  error = null,
  onRetry,
  offset = 0,
  onOffsetChange,
  daysAhead = 30,
}) {
  const days = useMemo(() => buildDateRange(VISIBLE_DAYS, offset), [offset])

  const canGoBack = offset > 0
  const canGoForward = offset + VISIBLE_DAYS < daysAhead

  const available = slots.filter((s) => s.available)

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900">Select a date</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onOffsetChange(Math.max(0, offset - VISIBLE_DAYS))}
              disabled={!canGoBack}
              aria-label="Previous week"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onOffsetChange(offset + VISIBLE_DAYS)}
              disabled={!canGoForward}
              aria-label="Next week"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Appointment date"
          className="grid grid-cols-4 gap-2 sm:grid-cols-7"
        >
          {days.map((d) => {
            const isSelected = selectedDate === d.key
            return (
              <button
                key={d.key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectDate(d.key)}
                className={cn(
                  'flex flex-col items-center rounded-xl border px-2 py-2.5 transition',
                  isSelected
                    ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                    : 'border-ink-200 bg-surface-raised text-ink-700 hover:border-brand-300 hover:bg-brand-50',
                )}
              >
                <span className={cn('text-[11px] font-medium', isSelected ? 'text-brand-50' : 'text-ink-500')}>
                  {d.isToday ? 'Today' : d.dayLabel}
                </span>
                <span className="mt-0.5 text-lg font-semibold leading-none">{d.dayNumber}</span>
                <span className={cn('mt-0.5 text-[11px]', isSelected ? 'text-brand-50' : 'text-ink-400')}>
                  {d.monthLabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Slot grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900">Select a time</h3>
          {!loading && !error && available.length > 0 && (
            <span className="text-xs font-medium text-emerald-700">
              {available.length} slot{available.length === 1 ? '' : 's'} available
            </span>
          )}
        </div>

        {loading && <LoadingState label="Checking availability…" className="py-10" />}

        {!loading && error && (
          <ErrorState title="Could not load slots" message={error} onRetry={onRetry} />
        )}

        {!loading && !error && slots.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-10 text-center">
            <CalendarX2 className="h-8 w-8 text-ink-300" aria-hidden="true" />
            <p className="text-sm font-medium text-ink-800">No consulting hours on this day</p>
            <p className="text-sm text-ink-500">Please choose another date from the strip above.</p>
          </div>
        )}

        {!loading && !error && slots.length > 0 && (
          <div
            role="radiogroup"
            aria-label="Appointment time"
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
          >
            {slots.map((slot) => {
              const isSelected = selectedTime === slot.time
              return (
                <button
                  key={slot.time}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!slot.available}
                  title={!slot.available ? 'This slot is already booked' : undefined}
                  onClick={() => onSelectTime(slot.time)}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-sm font-medium transition',
                    !slot.available &&
                      'cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300 line-through',
                    slot.available &&
                      !isSelected &&
                      'border-ink-200 bg-surface-raised text-ink-700 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700',
                    isSelected && 'border-brand-600 bg-brand-600 text-white shadow-sm',
                  )}
                >
                  {formatTime(slot.time)}
                </button>
              )
            })}
          </div>
        )}

        {!loading && !error && slots.length > 0 && available.length === 0 && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Every slot on this date is booked. Please select a different date.
          </p>
        )}
      </div>
    </div>
  )
}
