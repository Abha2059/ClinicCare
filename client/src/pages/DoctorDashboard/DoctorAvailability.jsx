import { useCallback, useEffect, useState } from 'react'
import { CalendarOff, Plus, Save, Trash2 } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import { ErrorState, LoadingState } from '../../components/common/States'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import doctorService from '../../services/doctorService'
import { WEEKDAYS } from '../../utils/constants'
import { formatDate, getErrorMessage, timeToMinutes, toDateKey } from '../../utils/helpers'

const SLOT_DURATIONS = [15, 20, 30, 45, 60]

/** Empty availability shape, used when a doctor has never configured hours. */
function blankAvailability() {
  return WEEKDAYS.reduce((acc, day) => {
    acc[day.key] = { isWorking: false, startTime: '09:00', endTime: '17:00' }
    return acc
  }, {})
}

export default function DoctorAvailability() {
  useDocumentTitle('Availability')
  const toast = useToast()

  const [availability, setAvailability] = useState(blankAvailability)
  const [slotDuration, setSlotDuration] = useState(30)
  const [unavailableDates, setUnavailableDates] = useState([])
  const [newDate, setNewDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await doctorService.me()
      const doctor = data.doctor
      const base = blankAvailability()
      WEEKDAYS.forEach((day) => {
        const existing = doctor?.availability?.[day.key]
        if (existing) {
          base[day.key] = {
            isWorking: Boolean(existing.isWorking),
            startTime: existing.startTime || '09:00',
            endTime: existing.endTime || '17:00',
          }
        }
      })
      setAvailability(base)
      setSlotDuration(doctor?.slotDuration || 30)
      setUnavailableDates(
        (doctor?.unavailableDates || []).map((d) => String(d).slice(0, 10)).sort(),
      )
    } catch (err) {
      setError(getErrorMessage(err, 'Your availability could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateDay = (key, patch) => {
    setAvailability((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const addUnavailableDate = () => {
    if (!newDate) return
    if (unavailableDates.includes(newDate)) {
      toast.warning('That date is already marked unavailable.')
      return
    }
    setUnavailableDates((prev) => [...prev, newDate].sort())
    setNewDate('')
  }

  const removeUnavailableDate = (date) => {
    setUnavailableDates((prev) => prev.filter((d) => d !== date))
  }

  /** End time must be after start time on every working day. */
  const validate = () => {
    const errors = {}
    WEEKDAYS.forEach((day) => {
      const slot = availability[day.key]
      if (!slot.isWorking) return
      if (!slot.startTime || !slot.endTime) {
        errors[day.key] = 'Set both a start and end time.'
      } else if (timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)) {
        errors[day.key] = 'End time must be after start time.'
      }
    })
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please correct the highlighted consulting hours.')
      return
    }
    setSaving(true)
    try {
      await doctorService.updateAvailability({
        availability,
        slotDuration: Number(slotDuration),
        unavailableDates,
      })
      toast.success('Availability updated.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Your availability could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading availability…" className="py-24" />
  if (error) return <ErrorState title="Availability unavailable" message={error} onRetry={load} />

  const todayKey = toDateKey(new Date())

  return (
    <>
      <PageHeader
        title="Availability"
        description="Set the days and hours you consult. Patients can only book inside these windows."
        actions={
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* ---------- Weekly hours ---------- */}
        <section className="card" aria-labelledby="hours-heading">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 id="hours-heading" className="font-semibold text-ink-900">
              Weekly consulting hours
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Toggle a day on to accept appointments, then set your window.
            </p>
          </div>

          <ul className="divide-y divide-ink-100">
            {WEEKDAYS.map((day) => {
              const slot = availability[day.key]
              const dayError = validationErrors[day.key]
              return (
                <li key={day.key} className="px-5 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        id={`working-${day.key}`}
                        type="checkbox"
                        checked={slot.isWorking}
                        onChange={(e) => updateDay(day.key, { isWorking: e.target.checked })}
                        className="checkbox"
                      />
                      <label
                        htmlFor={`working-${day.key}`}
                        className="w-24 text-sm font-medium text-ink-800"
                      >
                        {day.label}
                      </label>
                    </div>

                    {slot.isWorking ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor={`start-${day.key}`} className="sr-only">
                          {day.label} start time
                        </label>
                        <input
                          id={`start-${day.key}`}
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateDay(day.key, { startTime: e.target.value })}
                          className={`input h-10 w-32 ${dayError ? 'input-error' : ''}`}
                        />
                        <span className="text-sm text-ink-400">to</span>
                        <label htmlFor={`end-${day.key}`} className="sr-only">
                          {day.label} end time
                        </label>
                        <input
                          id={`end-${day.key}`}
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateDay(day.key, { endTime: e.target.value })}
                          className={`input h-10 w-32 ${dayError ? 'input-error' : ''}`}
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-ink-400">Not consulting</span>
                    )}
                  </div>

                  {dayError && (
                    <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                      {dayError}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </section>

        {/* ---------- Side panel ---------- */}
        <aside className="space-y-4">
          <section className="card card-body">
            <h2 className="text-sm font-semibold text-ink-900">Appointment length</h2>
            <p className="mt-1 text-sm text-ink-500">
              Your consulting window is divided into slots of this length.
            </p>
            <label htmlFor="slot-duration" className="label mt-4">
              Slot duration
            </label>
            <select
              id="slot-duration"
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="select"
            >
              {SLOT_DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </select>
          </section>

          <section className="card card-body">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
              <CalendarOff className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Unavailable dates
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Block specific dates such as leave or holidays.
            </p>

            <div className="mt-4 flex gap-2">
              <label htmlFor="new-unavailable" className="sr-only">
                Add an unavailable date
              </label>
              <input
                id="new-unavailable"
                type="date"
                min={todayKey}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input h-10 flex-1"
              />
              <button
                type="button"
                onClick={addUnavailableDate}
                disabled={!newDate}
                aria-label="Add unavailable date"
                className="btn-outline h-10 px-3"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {unavailableDates.length === 0 ? (
              <p className="mt-4 rounded-xl bg-ink-50 px-3.5 py-3 text-sm text-ink-500">
                No blocked dates. You are available on every working day above.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {unavailableDates.map((date) => (
                  <li
                    key={date}
                    className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 px-3.5 py-2.5"
                  >
                    <span className="text-sm text-ink-700">{formatDate(date)}</span>
                    <button
                      type="button"
                      onClick={() => removeUnavailableDate(date)}
                      aria-label={`Remove ${formatDate(date)}`}
                      className="rounded-md p-1 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
            <p className="text-xs leading-relaxed text-ink-600">
              Changes take effect immediately. Appointments already booked are not cancelled if you
              narrow your hours — review them in your appointments list.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
