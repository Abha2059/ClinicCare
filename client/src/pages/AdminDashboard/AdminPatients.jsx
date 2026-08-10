import { useCallback, useEffect, useState } from 'react'
import { Ban, Search, Users } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import Avatar from '../../components/common/Avatar'
import Pagination from '../../components/common/Pagination'
import { ConfirmModal } from '../../components/common/Modal'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/common/States'
import { useToast } from '../../context/AppContext'
import useDebounce from '../../hooks/useDebounce'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import adminService from '../../services/adminService'
import { formatDate, getErrorMessage } from '../../utils/helpers'

const PAGE_LIMIT = 10

export default function AdminPatients() {
  useDocumentTitle('Manage patients')
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ patients: [], total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [action, setAction] = useState(null)
  const [working, setWorking] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, limit: PAGE_LIMIT }
      if (debouncedSearch) params.search = debouncedSearch
      const data = await adminService.patients(params)
      setResult({
        patients: data.patients || [],
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      })
    } catch (err) {
      setError(getErrorMessage(err, 'The patient list could not be loaded.'))
      setResult({ patients: [], total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const runAction = async () => {
    if (!action) return
    setWorking(true)
    try {
      await action.run()
      toast.success(action.successMessage)
      setAction(null)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'That change could not be applied.'))
    } finally {
      setWorking(false)
    }
  }

  const { patients, total, totalPages } = result

  return (
    <>
      <PageHeader title="Patients" description="Registered patient accounts on ClinicCare." />

      <div className="relative mb-5 max-w-md">
        <label htmlFor="admin-patient-search" className="sr-only">
          Search patients
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          id="admin-patient-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="input pl-10"
        />
      </div>

      {loading && (
        <div className="table-wrap">
          <TableSkeleton rows={6} cols={4} />
        </div>
      )}

      {!loading && error && <ErrorState title="Could not load patients" message={error} onRetry={load} />}

      {!loading && !error && patients.length === 0 && (
        <EmptyState
          icon={Users}
          title="No patients found"
          message="Patient accounts will appear here once people register."
        />
      )}

      {!loading && !error && patients.length > 0 && (
        <>
          <p className="mb-4 text-sm text-ink-600" aria-live="polite">
            {total} patient{total === 1 ? '' : 's'}
          </p>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Patient</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Appointments</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => {
                  const isActive = patient.isActive !== false
                  return (
                    <tr key={patient._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={patient.profileImage} name={patient.name} size="xs" />
                          <div className="min-w-0">
                            <span className="block truncate font-medium text-ink-900">
                              {patient.name}
                            </span>
                            <span className="block truncate text-xs text-ink-500">
                              {patient.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">{patient.phone || '—'}</td>
                      <td className="whitespace-nowrap">{patient.appointmentCount ?? 0}</td>
                      <td className="whitespace-nowrap">
                        {formatDate(patient.createdAt, { weekday: undefined })}
                      </td>
                      <td>
                        <span className={isActive ? 'badge-success' : 'badge-danger'}>
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setAction({
                                run: () => adminService.setUserActive(patient._id, !isActive),
                                title: isActive ? 'Disable this account?' : 'Enable this account?',
                                message: isActive
                                  ? `${patient.name} will no longer be able to sign in or book appointments.`
                                  : `${patient.name} will be able to sign in again.`,
                                confirmLabel: isActive ? 'Disable account' : 'Enable account',
                                variant: isActive ? 'danger' : 'primary',
                                successMessage: isActive ? 'Account disabled.' : 'Account enabled.',
                              })
                            }
                            className="btn-ghost btn-sm whitespace-nowrap text-red-600 hover:bg-red-50"
                          >
                            <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                            {isActive ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
