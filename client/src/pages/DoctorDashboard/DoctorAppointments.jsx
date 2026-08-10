import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Check, X } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import AppointmentCard from '../../components/appointments/AppointmentCard'
import Pagination from '../../components/common/Pagination'
import { ConfirmModal } from '../../components/common/Modal'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import appointmentService from '../../services/appointmentService'
import { APPOINTMENT_STATUS } from '../../utils/constants'
import { getErrorMessage } from '../../utils/helpers'

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: APPOINTMENT_STATUS.PENDING, label: 'Pending' },
  { key: APPOINTMENT_STATUS.CONFIRMED, label: 'Confirmed' },
  { key: APPOINTMENT_STATUS.COMPLETED, label: 'Completed' },
  { key: APPOINTMENT_STATUS.CANCELLED, label: 'Cancelled' },
  { key: 'all', label: 'All' },
]

const PAGE_LIMIT = 8

export default function DoctorAppointments() {
  useDocumentTitle('Appointments')
  const toast = useToast()

  const [tab, setTab] = useState('upcoming')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ appointments: [], total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [action, setAction] = useState(null)
  const [working, setWorking] = useState(false)

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

  const runAction = async () => {
    if (!action) return
    setWorking(true)
    try {
      await appointmentService.updateStatus(action.id, action.status)
      toast.success(action.successMessage)
      setAction(null)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'The appointment could not be updated.'))
    } finally {
      setWorking(false)
    }
  }

  const { appointments, total, totalPages } = result

  const buildActions = (appointment) => {
    if (appointment.status === APPOINTMENT_STATUS.PENDING) {
      return (
        <>
          <button
            type="button"
            onClick={() =>
              setAction({
                id: appointment._id,
                status: APPOINTMENT_STATUS.CONFIRMED,
                title: 'Confirm this appointment?',
                message: `${appointment.patient?.name || 'The patient'} will see this visit as confirmed.`,
                confirmLabel: 'Confirm',
                variant: 'primary',
                successMessage: 'Appointment confirmed.',
              })
            }
            className="btn-primary btn-sm"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Accept
          </button>
          <button
            type="button"
            onClick={() =>
              setAction({
                id: appointment._id,
                status: APPOINTMENT_STATUS.REJECTED,
                title: 'Reject this appointment?',
                message: 'The slot will be released and the patient will be notified.',
                confirmLabel: 'Reject',
                variant: 'danger',
                successMessage: 'Appointment rejected.',
              })
            }
            className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Reject
          </button>
        </>
      )
    }

    if (appointment.status === APPOINTMENT_STATUS.CONFIRMED) {
      return (
        <button
          type="button"
          onClick={() =>
            setAction({
              id: appointment._id,
              status: APPOINTMENT_STATUS.COMPLETED,
              title: 'Mark as completed?',
              message: 'This records the consultation as finished and lets the patient leave a review.',
              confirmLabel: 'Mark completed',
              variant: 'primary',
              successMessage: 'Appointment marked completed.',
            })
          }
          className="btn-primary btn-sm"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Complete
        </button>
      )
    }

    return null
  }

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Review incoming requests and manage your consultation schedule."
      />

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
          title="No appointments in this view"
          message="New patient bookings will appear here as soon as they are made."
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
                perspective="doctor"
                detailsTo={`/doctor/appointments/${appointment._id}`}
                actions={buildActions(appointment)}
              />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-8" />
        </>
      )}

      <ConfirmModal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        onConfirm={runAction}
        loading={working}
        title={action?.title}
        message={action?.message}
        confirmLabel={action?.confirmLabel}
        variant={action?.variant}
      />
    </>
  )
}
