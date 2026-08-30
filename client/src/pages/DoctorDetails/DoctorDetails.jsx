import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  GraduationCap,
  Languages,
  MapPin,
  MessageSquare,
  Sparkles,
  Stethoscope,
  Wallet,
} from 'lucide-react'

import Avatar from '../../components/common/Avatar'
import Rating from '../../components/common/Rating'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/States'
import SlotPicker from '../../components/appointments/SlotPicker'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import doctorService from '../../services/doctorService'
import reviewService from '../../services/reviewService'
import { formatCurrency, formatDate, getErrorMessage, toDateKey } from '../../utils/helpers'
import { WEEKDAYS } from '../../utils/constants'

export default function DoctorDetails() {
  const { id } = useParams()

  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  // Slot preview on the profile — booking itself happens in the booking flow.
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [offset, setOffset] = useState(0)
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState(null)

  useDocumentTitle(doctor?.user?.name || 'Doctor profile')

  const loadDoctor = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await doctorService.get(id)
      setDoctor(data.doctor)
    } catch (err) {
      setError(getErrorMessage(err, 'This doctor profile could not be loaded.'))
      setDoctor(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true)
    try {
      const data = await reviewService.listForDoctor(id, { limit: 6 })
      setReviews(data.reviews || [])
    } catch {
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }, [id])

  const loadSlots = useCallback(async () => {
    if (!selectedDate) return
    setSlotsLoading(true)
    setSlotsError(null)
    try {
      const data = await doctorService.slots(id, selectedDate)
      setSlots(data.slots || [])
    } catch (err) {
      setSlotsError(getErrorMessage(err, 'Availability could not be loaded.'))
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [id, selectedDate])

  useEffect(() => {
    loadDoctor()
    loadReviews()
  }, [loadDoctor, loadReviews])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  if (loading) {
    return (
      <div className="container-app py-20">
        <LoadingState label="Loading doctor profile…" />
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className="container-app py-16">
        <ErrorState
          title="Doctor not found"
          message={error || 'This profile may have been removed.'}
          onRetry={loadDoctor}
        />
        <div className="mt-6 text-center">
          <Link to="/doctors" className="btn-outline">
            Back to all doctors
          </Link>
        </div>
      </div>
    )
  }

  const name = doctor.user?.name || 'Doctor'
  const specialtyName = doctor.specialty?.name || 'General Health'
  const languages = doctor.languages || []
  const expertise = doctor.expertise || []
  const availability = doctor.availability || {}

  return (
    <div className="container-app py-8 lg:py-10">
      <Breadcrumbs
        items={[
          { label: 'Find Doctors', to: '/doctors' },
          { label: name },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {/* ---------- Profile header ---------- */}
          <section className="card card-body">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar src={doctor.user?.profileImage} name={name} size="xl" className="mx-auto sm:mx-0" />

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-bold text-ink-900">{name}</h1>
                  {doctor.isVerified && (
                    <span className="badge-brand">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Verified
                    </span>
                  )}
                </div>

                <p className="mt-1 font-medium text-brand-700">{specialtyName}</p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-600 sm:justify-start">
                  {doctor.qualification && (
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-ink-400" aria-hidden="true" />
                      {doctor.qualification}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    {doctor.experience || 0} years experience
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Wallet className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    {formatCurrency(doctor.consultationFee)} consultation
                  </span>
                  {doctor.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-ink-400" aria-hidden="true" />
                      {doctor.location}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex justify-center sm:justify-start">
                  <Rating value={doctor.rating || 0} count={doctor.reviewCount || 0} />
                </div>

                {languages.length > 0 && (
                  <p className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-sm text-ink-600 sm:justify-start">
                    <Languages className="h-4 w-4 text-ink-400" aria-hidden="true" />
                    Speaks {languages.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ---------- About ---------- */}
          {doctor.bio && (
            <section className="card card-body" aria-labelledby="about-doctor">
              <h2 id="about-doctor" className="text-lg font-semibold text-ink-900">
                About {name}
              </h2>
              <p className="mt-3 leading-relaxed text-ink-600">{doctor.bio}</p>
            </section>
          )}

          {/* ---------- Expertise ---------- */}
          {expertise.length > 0 && (
            <section className="card card-body" aria-labelledby="expertise-heading">
              <h2
                id="expertise-heading"
                className="inline-flex items-center gap-2 text-lg font-semibold text-ink-900"
              >
                <Sparkles className="h-5 w-5 text-brand-600" aria-hidden="true" />
                Areas of expertise
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {expertise.map((item) => (
                  <li key={item} className="badge-neutral">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ---------- Weekly schedule ---------- */}
          <section className="card card-body" aria-labelledby="schedule-heading">
            <h2
              id="schedule-heading"
              className="inline-flex items-center gap-2 text-lg font-semibold text-ink-900"
            >
              <CalendarDays className="h-5 w-5 text-brand-600" aria-hidden="true" />
              Consulting hours
            </h2>
            <dl className="mt-4 divide-y divide-ink-100">
              {WEEKDAYS.map((day) => {
                const slot = availability[day.key]
                const isWorking = slot?.isWorking && slot?.startTime && slot?.endTime
                return (
                  <div key={day.key} className="flex items-center justify-between py-2.5">
                    <dt className="text-sm font-medium text-ink-700">{day.label}</dt>
                    <dd className={isWorking ? 'text-sm text-ink-600' : 'text-sm text-ink-400'}>
                      {isWorking ? `${slot.startTime} — ${slot.endTime}` : 'Not consulting'}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </section>

          {/* ---------- Reviews ---------- */}
          <section className="card card-body" aria-labelledby="reviews-heading">
            <h2
              id="reviews-heading"
              className="inline-flex items-center gap-2 text-lg font-semibold text-ink-900"
            >
              <MessageSquare className="h-5 w-5 text-brand-600" aria-hidden="true" />
              Patient reviews
              {doctor.reviewCount > 0 && (
                <span className="badge-neutral">{doctor.reviewCount}</span>
              )}
            </h2>

            {reviewsLoading && <LoadingState label="Loading reviews…" className="py-8" />}

            {!reviewsLoading && reviews.length === 0 && (
              <EmptyState
                icon={MessageSquare}
                title="No reviews yet"
                message={`${name} has not received any patient reviews so far.`}
                className="mt-4"
              />
            )}

            {!reviewsLoading && reviews.length > 0 && (
              <ul className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <li key={review._id} className="border-b border-ink-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <Avatar src={review.patient?.profileImage} name={review.patient?.name} size="xs" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-ink-900">
                            {review.patient?.name || 'Patient'}
                          </p>
                          <span className="text-xs text-ink-400">
                            {formatDate(review.createdAt, { weekday: undefined })}
                          </span>
                        </div>
                        <Rating value={review.rating} size="sm" showValue={false} className="mt-1" />
                        {review.comment && (
                          <p className="mt-2 text-sm leading-relaxed text-ink-600">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ---------- Booking sidebar ---------- */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-500">Consultation fee</p>
                <p className="text-2xl font-bold text-ink-900">
                  {formatCurrency(doctor.consultationFee)}
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Stethoscope className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <hr className="my-5 border-ink-100" />

            <h2 className="mb-4 text-sm font-semibold text-ink-900">Check availability</h2>

            <SlotPicker
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              selectedTime={null}
              onSelectTime={() => {}}
              slots={slots}
              loading={slotsLoading}
              error={slotsError}
              onRetry={loadSlots}
              offset={offset}
              onOffsetChange={setOffset}
            />

            <Link to={`/appointments/book/${doctor._id}`} className="btn-primary btn-lg mt-6 w-full">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
              Book Appointment
            </Link>

            <p className="mt-3 text-center text-xs text-ink-400">
              You will confirm the date, time and reason on the next screen.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
