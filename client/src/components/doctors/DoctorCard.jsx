import { Link } from 'react-router-dom'
import { BadgeCheck, Briefcase, Calendar, GraduationCap, Languages } from 'lucide-react'
import Avatar from '../common/Avatar'
import Rating from '../common/Rating'
import { formatCurrency, truncate } from '../../utils/helpers'

/**
 * Reusable doctor card used on the homepage, directory and specialty pages.
 * `doctor` is a populated Doctor document from the API.
 */
export default function DoctorCard({ doctor }) {
  if (!doctor) return null

  const name = doctor.user?.name || 'Doctor'
  const specialtyName = doctor.specialty?.name || 'General Health'
  const languages = Array.isArray(doctor.languages) ? doctor.languages : []
  const nextSlot = doctor.nextAvailable

  return (
    <article className="card-hover flex flex-col">
      <div className="card-body flex flex-1 flex-col">
        <div className="flex items-start gap-4">
          <Avatar src={doctor.user?.profileImage} name={name} size="md" />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold leading-snug text-ink-900">
                <Link
                  to={`/doctors/${doctor._id}`}
                  className="transition hover:text-brand-700 focus-visible:text-brand-700"
                >
                  {name}
                </Link>
              </h3>
              {doctor.isVerified && (
                <span
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-700"
                  title="Verified by ClinicCare"
                >
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">Verified</span>
                </span>
              )}
            </div>

            <p className="mt-0.5 text-sm font-medium leading-snug text-brand-700">{specialtyName}</p>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
              {doctor.qualification && (
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                  {doctor.qualification}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                {doctor.experience || 0} yrs exp
              </span>
            </div>

            <div className="mt-2">
              <Rating value={doctor.rating || 0} count={doctor.reviewCount || 0} size="sm" />
            </div>
          </div>
        </div>

        {languages.length > 0 && (
          <p className="mt-4 flex items-start gap-1.5 text-xs text-ink-500">
            <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{languages.join(', ')}</span>
          </p>
        )}

        {doctor.bio && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-600">
            {truncate(doctor.bio, 110)}
          </p>
        )}

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-ink-100 pt-4">
          <div>
            <p className="text-xs text-ink-500">Consultation fee</p>
            <p className="text-lg font-semibold text-ink-900">
              {formatCurrency(doctor.consultationFee)}
            </p>
          </div>
          {nextSlot && (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {nextSlot}
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Link to={`/doctors/${doctor._id}`} className="btn-outline">
            View Profile
          </Link>
          <Link to={`/appointments/book/${doctor._id}`} className="btn-primary">
            Book Now
          </Link>
        </div>
      </div>
    </article>
  )
}
