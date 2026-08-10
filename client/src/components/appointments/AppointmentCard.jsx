import { Link } from 'react-router-dom'
import { CalendarDays, Clock, MapPin, Video } from 'lucide-react'
import Avatar from '../common/Avatar'
import { StatusBadge } from '../common/Badge'
import { formatCurrency, formatDate, formatTime } from '../../utils/helpers'

/**
 * Appointment summary card.
 * `perspective` switches whose details are highlighted: a patient sees the
 * doctor, a doctor sees the patient.
 */
export default function AppointmentCard({ appointment, perspective = 'patient', detailsTo, actions }) {
  if (!appointment) return null

  const doctorUser = appointment.doctor?.user
  const patientUser = appointment.patient
  const isPatientView = perspective === 'patient'

  const personName = isPatientView ? doctorUser?.name || 'Doctor' : patientUser?.name || 'Patient'
  const personImage = isPatientView ? doctorUser?.profileImage : patientUser?.profileImage
  const subtitle = isPatientView
    ? appointment.specialty?.name || appointment.doctor?.specialty?.name || 'Consultation'
    : patientUser?.email || ''

  const isOnline = appointment.appointmentType === 'online'
  const href = detailsTo || `/dashboard/appointments/${appointment._id}`

  return (
    <article className="card p-4 transition hover:border-brand-200 hover:shadow-card-hover sm:p-5">
      <div className="flex items-start gap-4">
        <Avatar src={personImage} name={personName} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-ink-900">
                <Link to={href} className="transition hover:text-brand-700">
                  {personName}
                </Link>
              </h3>
              {subtitle && <p className="truncate text-sm text-ink-500">{subtitle}</p>}
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-600">
            <div className="inline-flex items-center gap-1.5">
              <dt className="sr-only">Date</dt>
              <CalendarDays className="h-4 w-4 text-ink-400" aria-hidden="true" />
              <dd>{formatDate(appointment.appointmentDate)}</dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <dt className="sr-only">Time</dt>
              <Clock className="h-4 w-4 text-ink-400" aria-hidden="true" />
              <dd>{formatTime(appointment.appointmentTime)}</dd>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <dt className="sr-only">Type</dt>
              {isOnline ? (
                <Video className="h-4 w-4 text-ink-400" aria-hidden="true" />
              ) : (
                <MapPin className="h-4 w-4 text-ink-400" aria-hidden="true" />
              )}
              <dd>{isOnline ? 'Online consultation' : 'In-clinic visit'}</dd>
            </div>
          </dl>

          {appointment.reason && (
            <p className="mt-2 line-clamp-1 text-sm text-ink-500">
              <span className="font-medium text-ink-600">Reason:</span> {appointment.reason}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink-900">
              {formatCurrency(appointment.consultationFee ?? appointment.doctor?.consultationFee)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {actions}
              <Link to={href} className="btn-outline btn-sm">
                View details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
