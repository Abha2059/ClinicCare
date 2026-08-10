import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Stethoscope,
  TrendingUp,
  Users,
} from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import StatCard from '../../components/dashboard/StatCard'
import MiniBarChart from '../../components/dashboard/MiniBarChart'
import Avatar from '../../components/common/Avatar'
import { StatusBadge } from '../../components/common/Badge'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import adminService from '../../services/adminService'
import { formatDate, formatTime, getErrorMessage } from '../../utils/helpers'

export default function AdminDashboard() {
  useDocumentTitle('Admin dashboard')

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminService.stats()
      setStats(data.stats)
    } catch (err) {
      setError(getErrorMessage(err, 'The admin dashboard could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <LoadingState label="Loading platform statistics…" className="py-24" />
  if (error) return <ErrorState title="Dashboard unavailable" message={error} onRetry={load} />

  const recent = stats?.recentAppointments || []
  const monthly = stats?.monthly || []
  const bySpecialty = stats?.bySpecialty || []

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Activity across doctors, patients and appointments."
        actions={
          <Link to="/admin/doctors" className="btn-primary">
            <Stethoscope className="h-4 w-4" aria-hidden="true" />
            Manage doctors
          </Link>
        }
      />

      {/* ---------- Headline stats ---------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total patients" value={stats?.totalPatients} icon={Users} tone="brand" />
        <StatCard label="Total doctors" value={stats?.totalDoctors} icon={Stethoscope} tone="info" />
        <StatCard
          label="Total appointments"
          value={stats?.totalAppointments}
          icon={CalendarDays}
          tone="success"
        />
        <StatCard
          label="Pending appointments"
          value={stats?.pendingAppointments}
          icon={CalendarClock}
          tone="warning"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Verified doctors"
          value={stats?.verifiedDoctors}
          icon={CheckCircle2}
          tone="success"
          hint={`${stats?.unverifiedDoctors ?? 0} awaiting review`}
        />
        <StatCard label="Completed visits" value={stats?.completedAppointments} icon={CheckCircle2} tone="info" />
        <StatCard label="Cancelled" value={stats?.cancelledAppointments} icon={CalendarDays} tone="neutral" />
        <StatCard label="Specialties" value={stats?.totalSpecialties} icon={TrendingUp} tone="brand" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* ---------- Monthly trend ---------- */}
        <section className="card card-body" aria-labelledby="monthly-heading">
          <h2 id="monthly-heading" className="font-semibold text-ink-900">
            Appointments per month
          </h2>
          <p className="mt-1 text-sm text-ink-500">Bookings created over the last six months.</p>

          {monthly.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No trend data yet"
              message="Appointment activity will be charted here."
              className="mt-4"
            />
          ) : (
            <div className="mt-6">
              <MiniBarChart data={monthly} />
            </div>
          )}
        </section>

        {/* ---------- Specialty distribution ---------- */}
        <section className="card card-body" aria-labelledby="specialty-heading">
          <h2 id="specialty-heading" className="font-semibold text-ink-900">
            Busiest specialties
          </h2>
          <p className="mt-1 text-sm text-ink-500">Appointment volume by area of care.</p>

          {bySpecialty.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="No specialty data yet"
              message="Once appointments are booked, the breakdown appears here."
              className="mt-4"
            />
          ) : (
            <ul className="mt-5 space-y-3">
              {bySpecialty.map((item) => {
                const max = Math.max(...bySpecialty.map((s) => s.count), 1)
                const pct = (item.count / max) * 100
                return (
                  <li key={item.name}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-ink-700">{item.name}</span>
                      <span className="shrink-0 font-medium text-ink-900">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ---------- Recent appointments ---------- */}
      <section className="mt-8" aria-labelledby="recent-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-heading" className="text-lg font-semibold text-ink-900">
            Latest appointments
          </h2>
          <Link to="/admin/appointments" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No appointments yet"
            message="New bookings across the platform will show up here."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Patient</th>
                  <th scope="col">Doctor</th>
                  <th scope="col">Date &amp; time</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar src={a.patient?.profileImage} name={a.patient?.name} size="xs" />
                        <span className="font-medium text-ink-900">{a.patient?.name || '—'}</span>
                      </div>
                    </td>
                    <td>{a.doctor?.user?.name || '—'}</td>
                    <td className="whitespace-nowrap">
                      {formatDate(a.appointmentDate, { weekday: undefined })}
                      <span className="ml-1.5 text-ink-400">{formatTime(a.appointmentTime)}</span>
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
