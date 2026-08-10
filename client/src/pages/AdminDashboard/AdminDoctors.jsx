import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Ban, Search, Stethoscope, X } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import Avatar from '../../components/common/Avatar'
import Rating from '../../components/common/Rating'
import Pagination from '../../components/common/Pagination'
import { ConfirmModal } from '../../components/common/Modal'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/common/States'
import { useApp, useToast } from '../../context/AppContext'
import useDebounce from '../../hooks/useDebounce'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import adminService from '../../services/adminService'
import { formatCurrency, getErrorMessage } from '../../utils/helpers'

const PAGE_LIMIT = 10

export default function AdminDoctors() {
  useDocumentTitle('Manage doctors')
  const { specialties } = useApp()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [verified, setVerified] = useState('')
  const [page, setPage] = useState(1)

  const [result, setResult] = useState({ doctors: [], total: 0, totalPages: 0 })
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
      if (specialty) params.specialty = specialty
      if (verified) params.isVerified = verified

      const data = await adminService.doctors(params)
      setResult({
        doctors: data.doctors || [],
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      })
    } catch (err) {
      setError(getErrorMessage(err, 'The doctor list could not be loaded.'))
      setResult({ doctors: [], total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, specialty, verified])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, specialty, verified])

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

  const { doctors, total, totalPages } = result

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Verify clinicians and manage who appears in the public directory."
      />

      {/* Filters */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <label htmlFor="admin-doctor-search" className="sr-only">
            Search doctors
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            id="admin-doctor-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="input pl-10"
          />
        </div>

        <div>
          <label htmlFor="admin-doctor-specialty" className="sr-only">
            Filter by specialty
          </label>
          <select
            id="admin-doctor-specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="select"
          >
            <option value="">All specialties</option>
            {specialties.map((s) => (
              <option key={s._id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="admin-doctor-verified" className="sr-only">
            Filter by verification
          </label>
          <select
            id="admin-doctor-verified"
            value={verified}
            onChange={(e) => setVerified(e.target.value)}
            className="select"
          >
            <option value="">All statuses</option>
            <option value="true">Verified</option>
            <option value="false">Awaiting verification</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="table-wrap">
          <TableSkeleton rows={6} cols={5} />
        </div>
      )}

      {!loading && error && <ErrorState title="Could not load doctors" message={error} onRetry={load} />}

      {!loading && !error && doctors.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          message="Try clearing the filters, or seed the database to add doctors."
        />
      )}

      {!loading && !error && doctors.length > 0 && (
        <>
          <p className="mb-4 text-sm text-ink-600" aria-live="polite">
            {total} doctor{total === 1 ? '' : 's'}
          </p>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Doctor</th>
                  <th scope="col">Specialty</th>
                  <th scope="col">Experience</th>
                  <th scope="col">Fee</th>
                  <th scope="col">Rating</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => {
                  const isActive = doctor.user?.isActive !== false
                  return (
                    <tr key={doctor._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={doctor.user?.profileImage} name={doctor.user?.name} size="xs" />
                          <div className="min-w-0">
                            <Link
                              to={`/doctors/${doctor._id}`}
                              className="block truncate font-medium text-ink-900 hover:text-brand-700"
                            >
                              {doctor.user?.name || '—'}
                            </Link>
                            <span className="block truncate text-xs text-ink-500">
                              {doctor.user?.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">{doctor.specialty?.name || '—'}</td>
                      <td className="whitespace-nowrap">{doctor.experience || 0} yrs</td>
                      <td className="whitespace-nowrap">{formatCurrency(doctor.consultationFee)}</td>
                      <td>
                        <Rating value={doctor.rating || 0} count={doctor.reviewCount || 0} size="sm" />
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className={doctor.isVerified ? 'badge-success' : 'badge-warning'}>
                            {doctor.isVerified ? 'Verified' : 'Pending'}
                          </span>
                          {!isActive && <span className="badge-danger">Disabled</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setAction({
                                run: () =>
                                  adminService.setDoctorVerification(doctor._id, !doctor.isVerified),
                                title: doctor.isVerified
                                  ? 'Remove verification?'
                                  : 'Verify this doctor?',
                                message: doctor.isVerified
                                  ? `${doctor.user?.name} will be hidden from the public directory until verified again.`
                                  : `${doctor.user?.name} will become visible in the public directory.`,
                                confirmLabel: doctor.isVerified ? 'Remove verification' : 'Verify',
                                variant: doctor.isVerified ? 'danger' : 'primary',
                                successMessage: doctor.isVerified
                                  ? 'Verification removed.'
                                  : 'Doctor verified.',
                              })
                            }
                            className="btn-outline btn-sm whitespace-nowrap"
                          >
                            {doctor.isVerified ? (
                              <>
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                                Unverify
                              </>
                            ) : (
                              <>
                                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                Verify
                              </>
                            )}
                          </button>

                          {doctor.user?._id && (
                            <button
                              type="button"
                              onClick={() =>
                                setAction({
                                  run: () => adminService.setUserActive(doctor.user._id, !isActive),
                                  title: isActive ? 'Disable this account?' : 'Enable this account?',
                                  message: isActive
                                    ? `${doctor.user?.name} will no longer be able to sign in.`
                                    : `${doctor.user?.name} will be able to sign in again.`,
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
                          )}
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
