import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '../../utils/helpers'

/**
 * Horizontally scrolling strip of common health concerns.
 *
 * Each card links to the specialty that treats it. The row scrolls natively
 * (so touch and trackpad gestures work), with arrow buttons layered on top for
 * mouse users. Arrows hide themselves at each end of the range.
 */
export default function ConditionCarousel({ items = [] }) {
  const trackRef = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  /** Recompute which arrows apply after any scroll or resize. */
  const syncArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    // Scroll snapping can settle a few pixels off zero, so the threshold is
    // wider than a sub-pixel rounding allowance. When the row is not
    // overflowing at all, both ends read true and neither arrow shows.
    setAtStart(el.scrollLeft <= 8)
    setAtEnd(el.scrollLeft >= max - 8)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return undefined

    // Images load after mount and change scrollWidth, so re-measure once the
    // browser has painted rather than trusting the first synchronous read.
    const raf = requestAnimationFrame(syncArrows)

    el.addEventListener('scroll', syncArrows, { passive: true })
    const observer = new ResizeObserver(syncArrows)
    observer.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', syncArrows)
      observer.disconnect()
    }
  }, [syncArrows, items.length])

  /** Page the strip by most of its visible width. */
  const scrollByPage = (direction) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2"
      >
        {items.map((item) => (
          <li key={item.name} className="w-40 shrink-0 snap-start sm:w-44">
            <Link to={`/specialties/${item.specialty}`} className="group block">
              <div className="overflow-hidden rounded-2xl border border-ink-100 bg-ink-50">
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  width={600}
                  height={450}
                  className="h-28 w-full object-cover transition duration-300 group-hover:scale-[1.04] sm:h-32"
                />
              </div>
              <p className="mt-2.5 truncate text-center text-sm font-medium text-ink-700 transition group-hover:text-brand-700">
                {item.name}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <CarouselArrow side="left" hidden={atStart} onClick={() => scrollByPage(-1)} />
      <CarouselArrow side="right" hidden={atEnd} onClick={() => scrollByPage(1)} />
    </div>
  )
}

/** Circular scroll control, vertically centred on the image row. */
function CarouselArrow({ side, hidden, onClick }) {
  const isLeft = side === 'left'
  const Icon = isLeft ? ChevronLeft : ChevronRight

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isLeft ? 'Show previous concerns' : 'Show more concerns'}
      // Hidden from everyone at the end of the range, so keyboard users don't
      // land on a control that cannot do anything.
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : 0}
      className={cn(
        'absolute top-14 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full',
        'border border-ink-200 bg-surface-raised text-ink-700 shadow-card transition',
        'hover:border-brand-300 hover:text-brand-700 sm:flex',
        isLeft ? '-left-3' : '-right-3',
        hidden && 'pointer-events-none opacity-0',
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
