import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Search } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import AppointmentCard from '../../components/appointments/AppointmentCard'
import Pagination from '../../components/common/Pagination'
import { ConfirmModal } from '../../components/common/Modal'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import appointmentService from '../../services/appointmentService'
import { APPOINTMENT_STATUS } from '../../utils/constants'
import { getErrorMessage, isPastSlot } from '../../utils/helpers'

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'all', label: 'All' },
  { key: APPOINTMENT_STATUS.PENDING, label: 'Pending' },
  { key: APPOINTMENT_STATUS.CONFIRMED, label: 'Confirmed' },
  { key: APPOINTMENT_STATUS.COMPLETED, label: 'Completed' },
  { key: APPOINTMENT_STATUS.CANCELLED, label: 'Cancelled' },
]

const PAGE_LIMIT = 8

export default function PatientAppointments() {
  useDocumentTitle('My appointments')
  const toast = useToast()

  const [tab, setTab] = useState('upcoming')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ appointments: [], total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit: PAGE_LIMIT, sort: tab === 'upcoming' ? 'date_asc' : 'date_desc' }
      if (tab === 'upcoming') params.upcoming = 'true'
      else if (tab !== 'all') params.status = tab

      const data = await appointmentService.list(params)
      setResult({
        appointments: data.appointments || [],
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      })
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load your appointments.'))
      setResult({ appointments: [], total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [tab, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [tab])

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await appointmentService.cancel(cancelTarget._id, 'Cancelled by patient')
      toast.success('Appointment cancelled.')
      setCancelTarget(null)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'This appointment could not be cancelled.'))
    } finally {
      setCancelling(false)
    }
  }

  /** A visit can be called off while it is still pending/confirmed and in the future. */
  const canCancel = (appointment) =>
    [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED].includes(appointment.status) &&
    !isPastSlot(
      String(appointment.appointmentDate).slice(0, 10),
      appointment.appointmentTime,
    )

  const { appointments, total, totalPages } = result

  return (
    <>
      <PageHeader
        title="My appointments"
        description="Track, review and manage every visit you have booked."
        actions={
          <Link to="/doctors" className="btn-primary">
            <Search className="h-4 w-4" aria-hidden="true" />
            Book new
          </Link>
        }
      />

      {/* Tabs */}
      <div className="mb-5 overflow-x-auto no-scrollbar">
        <div role="tablist" aria-label="Filter appointments" className="flex gap-2 border-b border-ink-100 pb-px">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
                tab === t.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-ink-500 hover:border-ink-200 hover:text-ink-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingState label="Loading appointments…" />}

      {!loading && error && <ErrorState title="Could not load appointments" message={error} onRetry={load} />}

      {!loading && !error && appointments.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title={tab === 'upcoming' ? 'No upcoming appointments' : 'Nothing to show here'}
          message={
            tab === 'upcoming'
              ? 'Book a visit and it will appear in this list.'
              : 'There are no appointments matching this filter.'
          }
          action={
            <Link to="/doctors" className="btn-primary btn-sm">
              Find a doctor
            </Link>
          }
        />
      )}

      {!loading && !error && appointments.length > 0 && (
        <>
          <p className="mb-4 text-sm text-ink-600" aria-live="polite">
            {total} appointment{total === 1 ? '' : 's'}
          </p>

          <div className="grid gap-4 xl:grid-cols-2">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                perspective="patient"
                actions={
                  canCancel(appointment) ? (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(appointment)}
                      className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  ) : null
                }
              />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-8" />
        </>
      )}

      <ConfirmModal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        loading={cancelling}
        title="Cancel this appointment?"
        message={
          cancelTarget
            ? `Your appointment with ${cancelTarget.doctor?.user?.name || 'the doctor'} will be cancelled. This cannot be undone — you would need to book a new slot.`
            : ''
        }
        confirmLabel="Yes, cancel it"
        cancelLabel="Keep appointment"
      />
    </>
  )
}
