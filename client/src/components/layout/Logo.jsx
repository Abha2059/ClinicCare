import { Link } from 'react-router-dom'
import { cn } from '../../utils/helpers'
import { BRAND } from '../../utils/constants'

/** ClinicCare wordmark — original branding, inline SVG so it needs no network fetch. */
export default function Logo({ to = '/', showTagline = false, className, invert = false }) {
  const mark = (
    <>
      <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
        <svg viewBox="0 0 48 48" className="h-6 w-6" aria-hidden="true">
          <path
            d="M24 35.5s-9.4-5.6-9.4-12.1a5.3 5.3 0 0 1 9.4-3.4 5.3 5.3 0 0 1 9.4 3.4c0 6.5-9.4 12.1-9.4 12.1Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path
            d="M14.8 26.4h5.1l1.9-3.3 2.4 5.6 2-3.6h6.9"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-lg font-bold tracking-tight',
            invert ? 'text-white' : 'text-ink-900',
          )}
        >
          Clinic<span className="text-brand-500">Care</span>
        </span>
        {showTagline && (
          <span className={cn('mt-1 text-[11px] font-medium', invert ? 'text-ink-300' : 'text-ink-500')}>
            {BRAND.tagline}
          </span>
        )}
      </span>
    </>
  )

  if (!to) {
    return <span className={cn('inline-flex items-center gap-2.5', className)}>{mark}</span>
  }

  return (
    <Link
      to={to}
      aria-label={`${BRAND.name} home`}
      className={cn('inline-flex items-center gap-2.5', className)}
    >
      {mark}
    </Link>
  )
}
