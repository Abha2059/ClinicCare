import { WEEKDAYS } from './constants'

/** Join truthy class names. */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

/** Format a number as INR currency without decimals. */
export function formatCurrency(value) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Convert a Date to a calendar key (YYYY-MM-DD) using LOCAL time.
 * Never use toISOString() for this — it shifts the day across timezones.
 */
export function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse a YYYY-MM-DD key into a local Date at midnight. */
export function fromDateKey(key) {
  if (!key) return null
  const [y, m, d] = String(key).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/** Weekday key ('monday'…) for a date or date key. */
export function weekdayKey(date) {
  const d = typeof date === 'string' ? fromDateKey(date) : date
  if (!d) return ''
  // JS: 0 = Sunday. WEEKDAYS starts at Monday.
  const idx = (d.getDay() + 6) % 7
  return WEEKDAYS[idx].key
}

/** "Mon, 12 Aug 2026" */
export function formatDate(date, opts = {}) {
  const d = typeof date === 'string' ? (date.length === 10 ? fromDateKey(date) : new Date(date)) : date
  if (!d || Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    weekday: opts.weekday ?? 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** "12 Aug" */
export function formatDateShort(date) {
  const d = typeof date === 'string' ? (date.length === 10 ? fromDateKey(date) : new Date(date)) : date
  if (!d || Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(d)
}

/** Convert 24h "14:30" to "02:30 PM". */
export function formatTime(time) {
  if (!time || typeof time !== 'string') return '—'
  const [hStr, mStr] = time.split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  if (Number.isNaN(h) || Number.isNaN(m)) return time
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

/** Minutes since midnight for "HH:MM". */
export function timeToMinutes(time) {
  const [h, m] = String(time || '').split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h * 60 + m
}

/** Minutes since midnight back to "HH:MM". */
export function minutesToTime(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** True when the date key is strictly before today (local). */
export function isPastDate(dateKey) {
  const d = fromDateKey(dateKey)
  if (!d) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

/** True when a date+time is in the past (local). */
export function isPastSlot(dateKey, time) {
  const d = fromDateKey(dateKey)
  if (!d) return false
  d.setMinutes(timeToMinutes(time))
  return d.getTime() < Date.now()
}

/** Build the next `count` selectable days starting today. */
export function buildDateRange(count = 14, startOffset = 0) {
  const out = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  for (let i = startOffset; i < startOffset + count; i += 1) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    out.push({
      key: toDateKey(d),
      date: d,
      dayLabel: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(d),
      dayNumber: d.getDate(),
      monthLabel: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(d),
      isToday: i === 0,
    })
  }
  return out
}

/** Initials for avatar fallbacks. */
export function getInitials(name = '') {
  return String(name)
    .replace(/^dr\.?\s+/i, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}

/** Deterministic pastel avatar background from a string. */
export function avatarColor(seed = '') {
  const palette = [
    'bg-brand-100 text-brand-700',
    'bg-sky-100 text-sky-700',
    'bg-amber-100 text-amber-700',
    'bg-violet-100 text-violet-700',
    'bg-rose-100 text-rose-700',
    'bg-emerald-100 text-emerald-700',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997
  return palette[hash % palette.length]
}

/** Truncate to a word boundary. */
export function truncate(text = '', max = 140) {
  const s = String(text)
  if (s.length <= max) return s
  return `${s.slice(0, s.lastIndexOf(' ', max))}…`
}

/** Extract a human-readable message from an axios error. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.msg ||
    error?.message ||
    fallback
  )
}

/** Debounce a function by `wait` ms. */
export function debounce(fn, wait = 300) {
  let timer
  const wrapped = (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
  wrapped.cancel = () => clearTimeout(timer)
  return wrapped
}
