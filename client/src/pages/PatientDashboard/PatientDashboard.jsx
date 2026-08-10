import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Search,
  XCircle,
} from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import StatCard from '../../components/dashboard/StatCard'
import AppointmentCard from '../../components/appointments/AppointmentCard'
import Avatar from '../../components/common/Avatar'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States'
import { useAuth } from '../../context/AuthContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import appointmentService from '../../services/appointmentService'
import { formatCurrency, formatDate, formatTime, getErrorMessage } from '../../utils/helpers'

export default function PatientDashboard() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()

  const [stats, setStats] = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsData, upcomingData, recentData] = await Promise.all([
        appointmentService.stats(),
        appointmentService.list({ upcoming: 'true', limit: 3, sort: 'date_asc' }),
        appointmentService.list({ limit: 4, sort: 'date_desc' }),
      ])
      setStats(statsData.stats)
      setUpcoming(upcomingData.appointments || [])
      setRecent(recentData.appointments || [])
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load your dashboard.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const firstName = user?.name?.split(' ')[0] || 'there'
  const nextAppointment = upcoming[0]

  if (loading) {
    return <LoadingState label="Loading your dashboard…" className="py-24" />
  }

  if (error) {
    return <ErrorState title="Dashboard unavailable" message={error} onRetry={load} />
  }

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here is an overview of your appointments and upcoming care."
        actions={
          <Link to="/doctors" className="btn-primary">
            <Search className="h-4 w-4" aria-hidden="true" />
            Book an appointment
          </Link>
        }
      />

      {/* ---------- Stats ---------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total appointments" value={stats?.total} icon={CalendarDays} tone="brand" />
        <StatCard label="Upcoming" value={stats?.upcoming} icon={CalendarClock} tone="info" />
        <StatCard label="Completed" value={stats?.completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Cancelled" value={stats?.cancelled} icon={XCircle} tone="neutral" />
      </div>

      {/* ---------- Next appointment highlight ---------- */}
      <section className="mt-6" aria-labelledby="next-appointment-heading">
        <h2 id="next-appointment-heading" className="mb-3 text-lg font-semibold text-ink-900">
          Your next appointment
        </h2>

        {nextAppointment ? (
          <div className="card overflow-hidden">
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 px-5 py-5 text-white sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={nextAppointment.doctor?.user?.profileImage}
                    name={nextAppointment.doctor?.user?.name}
                    size="md"
                    ring
                  />
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">
                      {nextAppointment.doctor?.user?.name || 'Doctor'}
                    </p>
                    <p className="truncate text-sm text-brand-50">
                      {nextAppointment.specialty?.name ||
                        nextAppointment.doctor?.specialty?.name ||
                        'Consultation'}
                    </p>
                  </div>
                </div>

                <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div>
                    <dt className="text-brand-100">Date</dt>
                    <dd className="font-semibold">{formatDate(nextAppointment.appointmentDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-brand-100">Time</dt>
                    <dd className="font-semibold">{formatTime(nextAppointment.appointmentTime)}</dd>
                  </div>
                  <div>
                    <dt className="text-brand-100">Fee</dt>
                    <dd className="font-semibold">
                      {formatCurrency(
                        nextAppointment.consultationFee ?? nextAppointment.doctor?.consultationFee,
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <p className="text-sm text-ink-600">
                <span className="font-medium text-ink-800">Reason:</span>{' '}
                {nextAppointment.reason || 'General consultation'}
              </p>
              <Link
                to={`/dashboard/appointments/${nextAppointment._id}`}
                className="btn-outline btn-sm"
              >
                View details
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={CalendarCheck}
            title="No upcoming appointments"
            message="When you book a visit, it will appear here with all the details."
            action={
              <Link to="/doctors" className="btn-primary btn-sm">
                Find a doctor
              </Link>
            }
          />
        )}
      </section>

      {/* ---------- Recent appointments ---------- */}
      <section className="mt-8" aria-labelledby="recent-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-heading" className="text-lg font-semibold text-ink-900">
            Recent appointments
          </h2>
          <Link to="/dashboard/appointments" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No appointment history yet"
            message="Your past and upcoming visits will be listed here."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {recent.map((appointment) => (
              <AppointmentCard key={appointment._id} appointment={appointment} perspective="patient" />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
