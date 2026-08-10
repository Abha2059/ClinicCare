import { WEEKDAY_KEYS } from '../models/Doctor.js'

/** True when the value is a well-formed YYYY-MM-DD calendar date. */
export function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return (
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  )
}

/** Weekday key ('monday'…'sunday') for a YYYY-MM-DD date. */
export function weekdayKeyFor(dateKey) {
  const [y, m, d] = String(dateKey).split('-').map(Number)
  const date = new Date(y, m - 1, d)
  // JS getDay(): 0 = Sunday. WEEKDAY_KEYS starts at Monday.
  return WEEKDAY_KEYS[(date.getDay() + 6) % 7]
}

/** Today's date as YYYY-MM-DD in server-local time. */
export function todayKey() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

/** True when the date key falls before today. */
export function isPastDate(dateKey) {
  return String(dateKey) < todayKey()
}

/** Minutes since midnight for "HH:MM". */
export function timeToMinutes(time) {
  const [h, m] = String(time || '').split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN
  return h * 60 + m
}

/**
 * True when a date+time has already passed.
 * Used to stop patients booking a slot earlier today.
 */
export function isPastSlot(dateKey, time) {
  const today = todayKey()
  if (dateKey < today) return true
  if (dateKey > today) return false

  const now = new Date()
  return timeToMinutes(time) <= now.getHours() * 60 + now.getMinutes()
}

/** Date key N days from today. */
export function dateKeyFromToday(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}
