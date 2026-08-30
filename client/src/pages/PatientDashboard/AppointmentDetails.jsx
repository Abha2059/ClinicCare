import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Ban,
  Building2,
  CalendarDays,
  Check,
  CheckCheck,
  ClipboardList,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RotateCcw,
  Smartphone,
  Stethoscope,
  UserRound,
  Video,
  Wallet,
  X,
} from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import Avatar from '../../components/common/Avatar'
import { PaymentBadge, StatusBadge } from '../../components/common/Badge'
import { ConfirmModal } from '../../components/common/Modal'
import Rating, { RatingInput } from '../../components/common/Rating'
import { ErrorState, LoadingState } from '../../components/common/States'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import appointmentService from '../../services/appointmentService'
import reviewService from '../../services/reviewService'
import { APPOINTMENT_STATUS, ROLES } from '../../utils/constants'
import { cn, formatCurrency, formatDate, formatTime, getErrorMessage, isPastSlot } from '../../utils/helpers'

/**
 * Every status an admin can move an appointment to, with the confirmation copy
 * for each. The server allows admins any transition, so this is the full set;
 * the current status is filtered out at render time.
 */
const ADMIN_STATUS_ACTIONS = [
  {
    status: APPOINTMENT_STATUS.PENDING,
    label: 'Set back to pending',
    icon: RotateCcw,
    buttonClass: 'btn-outline',
    title: 'Move this appointment back to pending?',
    message: 'The doctor will need to accept or reject the request again.',
    confirmLabel: 'Set to pending',
    variant: 'primary',
    successMessage: 'Appointment set back to pending.',
  },
  {
    status: APPOINTMENT_STATUS.CONFIRMED,
    label: 'Confirm appointment',
    icon: Check,
    buttonClass: 'btn-primary',
    title: 'Confirm this appointment?',
    message: 'The patient and doctor will both see this visit as confirmed.',
    confirmLabel: 'Confirm appointment',
    variant: 'primary',
    successMessage: 'Appointment confirmed.',
  },
  {
    status: APPOINTMENT_STATUS.COMPLETED,
    label: 'Mark as completed',
    icon: CheckCheck,
    buttonClass: 'btn-outline',
    title: 'Mark this appointment as completed?',
    message: 'This records the consultation as finished and lets the patient leave a review.',
    confirmLabel: 'Mark completed',
    variant: 'primary',
    successMessage: 'Appointment marked completed.',
  },
  {
    status: APPOINTMENT_STATUS.CANCELLED,
    label: 'Cancel appointment',
    icon: X,
    buttonClass: 'btn-outline text-red-600',
    buildExtra: () => ({ cancellationReason: 'Cancelled by the clinic' }),
    title: 'Cancel this appointment?',
    message:
      'The slot is released and the patient will see this visit as cancelled. A prepaid fee is marked for refund.',
    confirmLabel: 'Cancel appointment',
    variant: 'danger',
    successMessage: 'Appointment cancelled.',
  },
  {
    status: APPOINTMENT_STATUS.REJECTED,
    label: 'Reject appointment',
    icon: Ban,
    buttonClass: 'btn-outline text-red-600',
    buildExtra: () => ({ cancellationReason: 'Declined by the clinic' }),
    title: 'Reject this appointment?',
    message:
      'The slot is released and the patient will see this request as declined. A prepaid fee is marked for refund.',
    confirmLabel: 'Reject appointment',
    variant: 'danger',
    successMessage: 'Appointment rejected.',
  },
]

export default function AppointmentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const toast = useToast()
  useDocumentTitle('Appointment details')

  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [action, setAction] = useState(null) // pending status change awaiting confirmation
  const [working, setWorking] = useState(false)

  // Review state (patients only, after completion)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [existingReview, setExistingReview] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await appointmentService.get(id)
      setAppointment(data.appointment)
      setExistingReview(data.review || null)
    } catch (err) {
      setError(getErrorMessage(err, 'This appointment could not be loaded.'))
      setAppointment(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const runStatusChange = async () => {
    if (!action) return
    setWorking(true)
    try {
      await appointmentService.updateStatus(id, action.status, action.extra || {})
      toast.success(action.successMessage)
      setAction(null)
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'The appointment could not be updated.'))
    } finally {
      setWorking(false)
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    setReviewError(null)
    if (rating < 1) {
      setReviewError('Please select a star rating.')
      return
    }
    setSubmittingReview(true)
    try {
      await reviewService.create(appointment.doctor._id, {
        appointment: appointment._id,
        rating,
        comment: comment.trim(),
      })
      toast.success('Thank you — your review has been published.')
      setComment('')
      setRating(0)
      load()
    } catch (err) {
      setReviewError(getErrorMessage(err, 'Your review could not be saved.'))
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <LoadingState label="Loading appointment…" className="py-24" />

  if (error || !appointment) {
    return (
      <>
        <ErrorState title="Appointment not found" message={error} onRetry={load} />
        <div className="mt-6 text-center">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go back
          </button>
        </div>
      </>
    )
  }

  const doctorUser = appointment.doctor?.user
  const patientUser = appointment.patient
  const isOnline = appointment.appointmentType === 'online'
  const isPaidOnline = appointment.paymentMethod === 'upi'
  const reference = `CC-${String(appointment._id).slice(-8).toUpperCase()}`
  const dateKey = String(appointment.appointmentDate).slice(0, 10)
  const isPast = isPastSlot(dateKey, appointment.appointmentTime)

  const isPatient = role === ROLES.PATIENT
  const isDoctor = role === ROLES.DOCTOR
  const isAdmin = role === ROLES.ADMIN

  const isActive = [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED].includes(
    appointment.status,
  )

  const canPatientCancel = isPatient && isActive && !isPast
  const canDoctorAccept = isDoctor && appointment.status === APPOINTMENT_STATUS.PENDING
  const canDoctorComplete = isDoctor && appointment.status === APPOINTMENT_STATUS.CONFIRMED
  const canReview =
    isPatient && appointment.status === APPOINTMENT_STATUS.COMPLETED && !existingReview

  const backLink = isDoctor
    ? '/doctor/appointments'
    : isAdmin
      ? '/admin/appointments'
      : '/dashboard/appointments'

  return (
    <>
      <PageHeader
        title="Appointment details"
        description={`Reference ${reference}`}
        actions={
          <Link to={backLink} className="btn-outline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to list
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {/* ---------- Summary ---------- */}
          <section className="card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
              <h2 className="font-semibold text-ink-900">Visit summary</h2>
              <StatusBadge status={appointment.status} />
            </div>

            <dl className="grid gap-5 px-5 py-5 sm:grid-cols-2">
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
                  <dt className="text-xs text-ink-500">Type</dt>
                  <dd className="text-sm font-medium text-ink-900">
                    {isOnline ? 'Online consultation' : 'In-clinic visit'}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Wallet className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink-400" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-ink-500">Consultation fee</dt>
                  <dd className="text-sm font-medium text-ink-900">
                    {formatCurrency(appointment.consultationFee ?? appointment.doctor?.consultationFee)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                {isPaidOnline ? (
                  <Smartphone className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink-400" aria-hidden="true" />
                ) : (
                  <Building2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink-400" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <dt className="text-xs text-ink-500">Payment</dt>
                  <dd className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-900">
                    {isPaidOnline ? 'Online via UPI' : 'At the clinic'}
                    <PaymentBadge status={appointment.paymentStatus} />
                  </dd>
                  {appointment.paymentReference && (
                    <dd className="mt-0.5 font-mono text-xs text-ink-500">
                      {appointment.paymentReference}
                    </dd>
                  )}
                </div>
              </div>
            </dl>

            <div className="border-t border-ink-100 px-5 py-5">
              <div className="flex items-start gap-2.5">
                <ClipboardList className="mt-0.5 h-4.5 w-4.5 shrink-0 text-ink-400" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs text-ink-500">Reason for visit</p>
                  <p className="mt-0.5 text-sm text-ink-800">{appointment.reason || '—'}</p>
                  {appointment.symptoms && (
                    <>
                      <p className="mt-3 text-xs text-ink-500">Symptoms and notes</p>
                      <p className="mt-0.5 whitespace-pre-line text-sm text-ink-700">
                        {appointment.symptoms}
                      </p>
                    </>
                  )}
                  {appointment.cancellationReason && (
                    <>
                      <p className="mt-3 text-xs text-ink-500">Cancellation reason</p>
                      <p className="mt-0.5 text-sm text-red-700">{appointment.cancellationReason}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ---------- Review (patient, after completion) ---------- */}
          {isPatient && appointment.status === APPOINTMENT_STATUS.COMPLETED && (
            <section className="card card-body" aria-labelledby="review-heading">
              <h2 id="review-heading" className="inline-flex items-center gap-2 font-semibold text-ink-900">
                <MessageSquare className="h-5 w-5 text-brand-600" aria-hidden="true" />
                {existingReview ? 'Your review' : 'Rate your experience'}
              </h2>

              {existingReview ? (
                <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50/60 p-4">
                  <Rating value={existingReview.rating} size="sm" />
                  {existingReview.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-ink-700">
                      {existingReview.comment}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-ink-400">
                    Submitted {formatDate(existingReview.createdAt, { weekday: undefined })}
                  </p>
                </div>
              ) : (
                <form onSubmit={submitReview} className="mt-4 space-y-4">
                  <p className="text-sm text-ink-600">
                    How was your consultation with {doctorUser?.name || 'your doctor'}?
                  </p>

                  <div>
                    <span className="label">Your rating</span>
                    <RatingInput value={rating} onChange={setRating} error={reviewError} />
                  </div>

                  <div>
                    <label htmlFor="review-comment" className="label">
                      Comment <span className="font-normal text-ink-400">(optional)</span>
                    </label>
                    <textarea
                      id="review-comment"
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={500}
                      placeholder="Share what other patients should know…"
                      className="input resize-y"
                    />
                  </div>

                  {reviewError && (
                    <p className="text-sm text-red-600" role="alert">
                      {reviewError}
                    </p>
                  )}

                  <button type="submit" disabled={submittingReview} className="btn-primary">
                    {submittingReview ? 'Publishing…' : 'Publish review'}
                  </button>
                </form>
              )}
            </section>
          )}
        </div>

        {/* ---------- Side panel ---------- */}
        <aside className="space-y-4">
          {/* Doctor card */}
          <section className="card card-body">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Stethoscope className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Doctor
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <Avatar src={doctorUser?.profileImage} name={doctorUser?.name} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-900">{doctorUser?.name || 'Doctor'}</p>
                <p className="truncate text-xs text-brand-700">
                  {appointment.specialty?.name || appointment.doctor?.specialty?.name || 'Consultation'}
                </p>
              </div>
            </div>
            {appointment.doctor?._id && (
              <Link to={`/doctors/${appointment.doctor._id}`} className="btn-outline btn-sm mt-4 w-full">
                View profile
              </Link>
            )}
          </section>

          {/* Patient card — visible to doctor and admin */}
          {(isDoctor || isAdmin) && (
            <section className="card card-body">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
                <UserRound className="h-4 w-4 text-brand-600" aria-hidden="true" />
                Patient
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <Avatar src={patientUser?.profileImage} name={patientUser?.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">{patientUser?.name || 'Patient'}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                {patientUser?.email && (
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Email</dt>
                    <Mail className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                    <dd className="truncate text-ink-700">{patientUser.email}</dd>
                  </div>
                )}
                {(appointment.patientPhone || patientUser?.phone) && (
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Phone</dt>
                    <Phone className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                    <dd className="text-ink-700">
                      {appointment.patientPhone || patientUser?.phone}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Admin status override — admins may set any status at any time. */}
          {isAdmin && (
            <section className="card card-body">
              <h2 className="text-sm font-semibold text-ink-900">Change status</h2>
              <p className="mt-1 text-xs text-ink-500">
                Currently <StatusBadge status={appointment.status} className="align-middle" />
              </p>

              <div className="mt-3 space-y-2">
                {ADMIN_STATUS_ACTIONS.filter((a) => a.status !== appointment.status).map((a) => (
                  <button
                    key={a.status}
                    type="button"
                    onClick={() => setAction({ ...a, extra: a.buildExtra?.() })}
                    className={cn('w-full', a.buttonClass)}
                  >
                    <a.icon className="h-4 w-4" aria-hidden="true" />
                    {a.label}
                  </button>
                ))}
              </div>

              <p className="mt-3 text-xs text-ink-400">
                Changing to cancelled or rejected frees the doctor&rsquo;s slot. A prepaid
                consultation is marked for refund automatically.
              </p>
            </section>
          )}

          {/* Actions */}
          {(canPatientCancel || canDoctorAccept || canDoctorComplete) && (
            <section className="card card-body">
              <h2 className="text-sm font-semibold text-ink-900">Actions</h2>
              <div className="mt-3 space-y-2">
                {canDoctorAccept && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setAction({
                          status: APPOINTMENT_STATUS.CONFIRMED,
                          title: 'Confirm this appointment?',
                          message: 'The patient will see this visit as confirmed.',
                          confirmLabel: 'Confirm appointment',
                          variant: 'primary',
                          successMessage: 'Appointment confirmed.',
                        })
                      }
                      className="btn-primary w-full"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Accept appointment
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAction({
                          status: APPOINTMENT_STATUS.REJECTED,
                          title: 'Reject this appointment?',
                          message:
                            'The patient will be notified that this request was declined and the slot will be released.',
                          confirmLabel: 'Reject appointment',
                          variant: 'danger',
                          successMessage: 'Appointment rejected.',
                        })
                      }
                      className="btn-outline w-full text-red-600"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Reject
                    </button>
                  </>
                )}

                {canDoctorComplete && (
                  <button
                    type="button"
                    onClick={() =>
                      setAction({
                        status: APPOINTMENT_STATUS.COMPLETED,
                        title: 'Mark as completed?',
                        message: 'This records the consultation as finished and lets the patient leave a review.',
                        confirmLabel: 'Mark completed',
                        variant: 'primary',
                        successMessage: 'Appointment marked completed.',
                      })
                    }
                    className="btn-primary w-full"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Mark as completed
                  </button>
                )}

                {canPatientCancel && (
                  <button
                    type="button"
                    onClick={() =>
                      setAction({
                        status: APPOINTMENT_STATUS.CANCELLED,
                        extra: { cancellationReason: 'Cancelled by patient' },
                        title: 'Cancel this appointment?',
                        message:
                          'This cannot be undone. You would need to book a new slot if you change your mind.',
                        confirmLabel: 'Yes, cancel it',
                        variant: 'danger',
                        successMessage: 'Appointment cancelled.',
                      })
                    }
                    className="btn-outline w-full text-red-600"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Cancel appointment
                  </button>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>

      <ConfirmModal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        onConfirm={runStatusChange}
        loading={working}
        title={action?.title}
        message={action?.message}
        confirmLabel={action?.confirmLabel}
        variant={action?.variant}
      />
    </>
  )
}
