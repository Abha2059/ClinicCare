import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  MapPin,
  Smartphone,
  Stethoscope,
  UserRound,
  Video,
} from 'lucide-react'

import Avatar from '../../components/common/Avatar'
import { PaymentBadge, StatusBadge } from '../../components/common/Badge'
import { ErrorState, LoadingState } from '../../components/common/States'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import appointmentService from '../../services/appointmentService'
import { formatCurrency, formatDate, formatTime, getErrorMessage } from '../../utils/helpers'

export default function BookingSuccess() {
  const { id } = useParams()
  useDocumentTitle('Appointment confirmed')

  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await appointmentService.get(id)
      setAppointment(data.appointment)
    } catch (err) {
      setError(getErrorMessage(err, 'This appointment could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="container-app py-20">
        <LoadingState label="Loading your confirmation…" />
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="container-app py-16">
        <ErrorState title="Confirmation unavailable" message={error} onRetry={load} />
        <div className="mt-6 text-center">
          <Link to="/dashboard/appointments" className="btn-outline">
            Go to my appointments
          </Link>
        </div>
      </div>
    )
  }

  const doctorName = appointment.doctor?.user?.name || 'Doctor'
  const specialtyName = appointment.specialty?.name || appointment.doctor?.specialty?.name || 'Consultation'
  const isOnline = appointment.appointmentType === 'online'
  const isPaidOnline = appointment.paymentMethod === 'upi'
  // Short, human-friendly reference derived from the record id.
  const reference = `CC-${String(appointment._id).slice(-8).toUpperCase()}`

  return (
    <div className="container-app py-10 lg:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold sm:text-3xl">Your appointment is booked</h1>
          <p className="mt-2 text-ink-600">
            We have sent the details to your dashboard. The clinic will confirm shortly.
          </p>
        </div>

        <div className="card mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Appointment ID
              </p>
              <p className="font-mono text-sm font-semibold text-ink-900">{reference}</p>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="flex items-center gap-4 rounded-2xl bg-ink-50/70 p-4">
              <Avatar src={appointment.doctor?.user?.profileImage} name={doctorName} size="md" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-ink-900">{doctorName}</h2>
                <p className="truncate text-sm text-brand-700">{specialtyName}</p>
              </div>
            </div>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <CalendarDays className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink-400" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-ink-500">Date</dt>
                  <dd className="text-sm font-medium text-ink-900">
                    {formatDate(appointment.appointmentDate)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink-400" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-ink-500">Time</dt>
                  <dd className="text-sm font-medium text-ink-900">
                    {formatTime(appointment.appointmentTime)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                {isOnline ? (
                  <Video className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink-400" aria-hidden="true" />
                ) : (
                  <MapPin className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink-400" aria-hidden="true" />
                )}
                <div>
                  <dt className="text-xs text-ink-500">Appointment type</dt>
                  <dd className="text-sm font-medium text-ink-900">
                    {isOnline ? 'Online consultation' : 'In-clinic visit'}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <UserRound className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink-400" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-ink-500">Patient</dt>
                  <dd className="text-sm font-medium text-ink-900">
                    {appointment.patient?.name || 'You'}
                  </dd>
                </div>
              </div>
            </dl>

            {appointment.reason && (
              <div className="mt-5 rounded-xl border border-ink-100 p-4">
                <p className="text-xs text-ink-500">Reason for visit</p>
                <p className="mt-1 text-sm text-ink-800">{appointment.reason}</p>
              </div>
            )}

            <div className="mt-5 border-t border-ink-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm text-ink-500">
                  <Stethoscope className="h-4 w-4" aria-hidden="true" />
                  Consultation fee
                </span>
                <span className="text-lg font-bold text-ink-900">
                  {formatCurrency(appointment.consultationFee ?? appointment.doctor?.consultationFee)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm text-ink-500">
                  {isPaidOnline ? (
                    <Smartphone className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  {isPaidOnline ? 'Paid online via UPI' : 'Pay at the clinic'}
                </span>
                <PaymentBadge status={appointment.paymentStatus} />
              </div>

              {appointment.paymentReference && (
                <p className="mt-2 text-xs text-ink-500">
                  Payment reference{' '}
                  <span className="font-mono font-medium text-ink-700">
                    {appointment.paymentReference}
                  </span>
                </p>
              )}
            </div>

            {!isPaidOnline && (
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Please carry the fee to your visit — the reception desk accepts cash, card and UPI.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link to={`/dashboard/appointments/${appointment._id}`} className="btn-outline btn-lg">
            View Appointment
          </Link>
          <Link to="/dashboard" className="btn-primary btn-lg">
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            Go to Dashboard
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-ink-500">
          Need a different time?{' '}
          <Link to="/dashboard/appointments" className="link">
            Manage your appointments
          </Link>
        </p>
      </div>
    </div>
  )
}
