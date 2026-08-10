import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Search } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import Avatar from '../../components/common/Avatar'
import { StatusBadge } from '../../components/common/Badge'
import Pagination from '../../components/common/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/common/States'
import useDebounce from '../../hooks/useDebounce'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import adminService from '../../services/adminService'
import { APPOINTMENT_STATUS } from '../../utils/constants'
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

export default function AdminAppointments() {
  useDocumentTitle('All appointments')

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

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
                      <StatusBadge status={a.status} />
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
