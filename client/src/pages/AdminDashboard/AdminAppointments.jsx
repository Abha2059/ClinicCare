import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Check, Search, X } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import Avatar from '../../components/common/Avatar'
import { StatusBadge } from '../../components/common/Badge'
import Pagination from '../../components/common/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/common/States'
import useDebounce from '../../hooks/useDebounce'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { useToast } from '../../context/AppContext'
import adminService from '../../services/adminService'
import appointmentService from '../../services/appointmentService'
import { APPOINTMENT_STATUS, STATUS_META } from '../../utils/constants'
import { formatCurrency, formatDate, formatTime, getErrorMessage } from '../../utils/helpers'

const PAGE_LIMIT = 12

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: APPOINTMENT_STATUS.PENDING, label: 'Pending' },
  { value: APPOINTMENT_STATUS.CONFIRMED, label: 'Confirmed' },
  { value: APPOINTMENT_STATUS.COMPLETED, label: 'Completed' },
  { value: APPOINTMENT_STATUS.CANCELLED, label: 'Cancelled' },
  { value: APPOINTMENT_STATUS.REJECTED, label: 'Rejected' },
]

/** Statuses an admin can assign from the table. */
const ASSIGNABLE = [
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.COMPLETED,
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.REJECTED,
]

/** Reason recorded when an admin closes an appointment from the table. */
function reasonFor(next) {
  if (next === APPOINTMENT_STATUS.CANCELLED) return 'Cancelled by the clinic'
  if (next === APPOINTMENT_STATUS.REJECTED) return 'Declined by the clinic'
  return undefined
}

/**
 * Inline status control for one row. Shows the badge alongside a select so the
 * current state stays readable while still being editable.
 */
function StatusChanger({ appointment, onChanged, busy, onBusy }) {
  const toast = useToast()

  const change = async (next) => {
    if (next === appointment.status) return
    onBusy(appointment._id)
    try {
      const reason = reasonFor(next)
      await appointmentService.updateStatus(
        appointment._id,
        next,
        reason ? { cancellationReason: reason } : {},
      )
      toast.success(`Appointment marked ${STATUS_META[next]?.label.toLowerCase() || next}.`)
      await onChanged()
    } catch (err) {
      toast.error(getErrorMessage(err, 'The status could not be changed.'))
    } finally {
      onBusy(null)
    }
  }

  // An incoming booking gets explicit accept/reject actions rather than a
  // dropdown, so triaging new requests is one click instead of two.
  if (appointment.status === APPOINTMENT_STATUS.PENDING) {
    return (
      <div className="flex items-center gap-2">
        <StatusBadge status={appointment.status} />
        <button
          type="button"
          disabled={busy}
          onClick={() => change(APPOINTMENT_STATUS.CONFIRMED)}
          className="btn-primary btn-sm"
          title={`Accept ${appointment.patient?.name || 'this'} booking`}
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => change(APPOINTMENT_STATUS.REJECTED)}
          className="btn-danger btn-sm"
          title={`Reject ${appointment.patient?.name || 'this'} booking`}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Reject
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={appointment.status} />
      <label className="sr-only" htmlFor={`status-${appointment._id}`}>
        Change status for {appointment.patient?.name || 'this appointment'}
      </label>
      <select
        id={`status-${appointment._id}`}
        value={appointment.status}
        disabled={busy}
        onChange={(e) => change(e.target.value)}
        className="select h-8 w-auto min-w-[7.5rem] py-0 pl-2.5 pr-7 text-xs disabled:opacity-50"
      >
        {ASSIGNABLE.map((s) => (
          <option key={s} value={s}>
            {STATUS_META[s]?.label || s}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function AdminAppointments() {
  useDocumentTitle('All appointments')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  // Id of the row currently saving, so only that select is disabled.
  const [updatingId, setUpdatingId] = useState(null)

  const [result, setResult] = useState({ appointments: [], total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const debouncedSearch = useDebounce(search, 400)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit: PAGE_LIMIT, sort: 'date_desc' }
      if (debouncedSearch) params.search = debouncedSearch
      if (status) params.status = status

      const data = await adminService.appointments(params)
      setResult({
        appointments: data.appointments || [],
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Appointments could not be loaded.'))
      setResult({ appointments: [], total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, status])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status])

  const { appointments, total, totalPages } = result

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Every booking made across the ClinicCare platform."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <label htmlFor="admin-appointment-search" className="sr-only">
            Search appointments
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            id="admin-appointment-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient or doctor name…"
            className="input pl-10"
          />
        </div>

        <div>
          <label htmlFor="admin-appointment-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="admin-appointment-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="table-wrap">
          <TableSkeleton rows={8} cols={5} />
        </div>
      )}

      {!loading && error && <ErrorState title="Could not load appointments" message={error} onRetry={load} />}

      {!loading && !error && appointments.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No appointments found"
          message="Try a different search term or clear the status filter."
        />
      )}

      {!loading && !error && appointments.length > 0 && (
        <>
          <p className="mb-4 text-sm text-ink-600" aria-live="polite">
            {total} appointment{total === 1 ? '' : 's'}
          </p>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Patient</th>
                  <th scope="col">Doctor</th>
                  <th scope="col">Specialty</th>
                  <th scope="col">Date &amp; time</th>
                  <th scope="col">Fee</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar src={a.patient?.profileImage} name={a.patient?.name} size="xs" />
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-ink-900">
                            {a.patient?.name || '—'}
                          </span>
                          <span className="block truncate text-xs text-ink-500">
                            {a.patient?.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{a.doctor?.user?.name || '—'}</td>
                    <td className="whitespace-nowrap">
                      {a.specialty?.name || a.doctor?.specialty?.name || '—'}
                    </td>
                    <td className="whitespace-nowrap">
                      {formatDate(a.appointmentDate, { weekday: undefined })}
                      <span className="ml-1.5 text-ink-400">{formatTime(a.appointmentTime)}</span>
                    </td>
                    <td className="whitespace-nowrap">
                      {formatCurrency(a.consultationFee ?? a.doctor?.consultationFee)}
                    </td>
                    <td>
                      <StatusChanger
                        appointment={a}
                        onChanged={load}
                        busy={updatingId === a._id}
                        onBusy={setUpdatingId}
                      />
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <Link to={`/admin/appointments/${a._id}`} className="btn-outline btn-sm">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={setPage} className="mt-8" />
        </>
      )}
    </>
  )
}
