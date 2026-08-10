import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Star,
  TriangleAlert,
} from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import StatCard from '../../components/dashboard/StatCard'
import AppointmentCard from '../../components/appointments/AppointmentCard'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States'
import { useAuth } from '../../context/AuthContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import doctorService from '../../services/doctorService'
import appointmentService from '../../services/appointmentService'
import { formatDate, getErrorMessage, toDateKey } from '../../utils/helpers'

export default function DoctorDashboard() {
  useDocumentTitle('Doctor dashboard')
  const { user } = useAuth()

  const [stats, setStats] = useState(null)
  const [today, setToday] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const todayKey = toDateKey(new Date())
      const [statsData, todayData, upcomingData, profileData] = await Promise.all([
        doctorService.stats(),
        appointmentService.list({ date: todayKey, limit: 20, sort: 'time_asc' }),
        appointmentService.list({ upcoming: 'true', limit: 4, sort: 'date_asc' }),
        doctorService.me().catch(() => null),
      ])
      setStats(statsData.stats)
      setToday(todayData.appointments || [])
      setUpcoming(upcomingData.appointments || [])
      setProfile(profileData?.doctor || null)
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load your dashboard.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <LoadingState label="Loading your dashboard…" className="py-24" />
  if (error) return <ErrorState title="Dashboard unavailable" message={error} onRetry={load} />

  const firstName = user?.name?.replace(/^dr\.?\s+/i, '').split(' ')[0] || 'Doctor'

  return (
    <>
      <PageHeader
        title={`Good to see you, Dr. ${firstName}`}
        description={`Today is ${formatDate(new Date())}. Here is your practice at a glance.`}
        actions={
          <Link to="/doctor/availability" className="btn-outline">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Manage availability
          </Link>
        }
      />

      {/* Verification notice */}
      {profile && profile.isVerified === false && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-amber-900">Your profile is awaiting verification</p>
            <p className="mt-0.5 text-sm text-amber-800">
              A ClinicCare administrator is reviewing your details. Your profile will appear in the
              public directory once it is approved.
            </p>
          </div>
        </div>
      )}

      {/* ---------- Stats ---------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's appointments" value={stats?.today} icon={CalendarDays} tone="brand" />
        <StatCard label="Pending requests" value={stats?.pending} icon={Clock} tone="warning" />
        <StatCard label="Upcoming" value={stats?.upcoming} icon={CalendarClock} tone="info" />
        <StatCard label="Completed" value={stats?.completed} icon={CheckCircle2} tone="success" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Average rating"
          value={(stats?.rating ?? 0).toFixed(1)}
          icon={Star}
          tone="warning"
          hint={`${stats?.reviewCount ?? 0} patient review${stats?.reviewCount === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Total appointments"
          value={stats?.total}
          icon={CalendarCheck}
          tone="neutral"
          hint="All time"
        />
      </div>

      {/* ---------- Today ---------- */}
      <section className="mt-8" aria-labelledby="today-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="today-heading" className="text-lg font-semibold text-ink-900">
            Today's schedule
          </h2>
          <Link to="/doctor/appointments" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>

        {today.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No appointments today"
            message="Enjoy the quieter day — new bookings will appear here automatically."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {today.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                perspective="doctor"
                detailsTo={`/doctor/appointments/${appointment._id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---------- Upcoming ---------- */}
      <section className="mt-8" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="mb-3 text-lg font-semibold text-ink-900">
          Coming up next
        </h2>

        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nothing scheduled ahead"
            message="Upcoming confirmed and pending visits will be listed here."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {upcoming.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                perspective="doctor"
                detailsTo={`/doctor/appointments/${appointment._id}`}
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
