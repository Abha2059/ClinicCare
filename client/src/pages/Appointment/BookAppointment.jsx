import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  Stethoscope,
  UserRound,
  Video,
  Wallet,
} from 'lucide-react'

import Avatar from '../../components/common/Avatar'
import Rating from '../../components/common/Rating'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import Stepper from '../../components/appointments/Stepper'
import SlotPicker from '../../components/appointments/SlotPicker'
import { ErrorState, LoadingState } from '../../components/common/States'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import doctorService from '../../services/doctorService'
import appointmentService from '../../services/appointmentService'
import { APPOINTMENT_TYPES } from '../../utils/constants'
import { formatCurrency, formatDate, formatTime, getErrorMessage, toDateKey } from '../../utils/helpers'

const STEPS = [
  { label: 'Doctor' },
  { label: 'Date' },
  { label: 'Time' },
  { label: 'Your details' },
  { label: 'Reason' },
  { label: 'Summary' },
  { label: 'Confirm' },
]

export default function BookAppointment() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()
  useDocumentTitle('Book an appointment')

  const [step, setStep] = useState(0)

  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Booking selections
  const [date, setDate] = useState(() => toDateKey(new Date()))
  const [time, setTime] = useState('')
  const [offset, setOffset] = useState(0)
  const [appointmentType, setAppointmentType] = useState('in-clinic')
  const [reason, setReason] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [patientPhone, setPatientPhone] = useState(user?.phone || '')

  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadDoctor = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await doctorService.get(doctorId)
      setDoctor(data.doctor)
    } catch (err) {
      setLoadError(getErrorMessage(err, 'This doctor could not be loaded.'))
      setDoctor(null)
    } finally {
      setLoading(false)
    }
  }, [doctorId])

  const loadSlots = useCallback(async () => {
    if (!date) return
    setSlotsLoading(true)
    setSlotsError(null)
    try {
      const data = await doctorService.slots(doctorId, date)
      const list = data.slots || []
      setSlots(list)
      // If the previously chosen time is no longer free, drop it.
      setTime((current) => {
        if (!current) return ''
        const match = list.find((s) => s.time === current)
        return match?.available ? current : ''
      })
    } catch (err) {
      setSlotsError(getErrorMessage(err, 'Availability could not be loaded.'))
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }, [doctorId, date])

  useEffect(() => {
    loadDoctor()
  }, [loadDoctor])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  useEffect(() => {
    if (user?.phone) setPatientPhone(user.phone)
  }, [user?.phone])

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return Boolean(doctor)
      case 1:
        return Boolean(date)
      case 2:
        return Boolean(time)
      case 3:
        return /^[0-9]{10}$/.test(patientPhone.trim())
      case 4:
        return reason.trim().length >= 5
      default:
        return true
    }
  }, [step, doctor, date, time, patientPhone, reason])

  const stepHint = useMemo(() => {
    switch (step) {
      case 2:
        return 'Select an available time slot to continue.'
      case 3:
        return 'Enter a valid 10-digit phone number so the clinic can reach you.'
      case 4:
        return 'Describe your reason for the visit in at least 5 characters.'
      default:
        return ''
    }
  }, [step])

  const goNext = () => {
    if (!canContinue) return
    setFormError(null)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setFormError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    setFormError(null)
    try {
      const payload = {
        doctor: doctorId,
        appointmentDate: date,
        appointmentTime: time,
        appointmentType,
        reason: reason.trim(),
        symptoms: symptoms.trim(),
        patientPhone: patientPhone.trim(),
      }
      const data = await appointmentService.create(payload)
      toast.success('Appointment booked successfully.')
      navigate(`/appointments/success/${data.appointment._id}`, { replace: true })
    } catch (err) {
      const message = getErrorMessage(err, 'We could not confirm this appointment.')
      setFormError(message)
      // A 409 means someone took the slot first — refresh availability and send
      // the patient back to pick a new time.
      if (err?.response?.status === 409) {
        toast.error('That slot was just booked by someone else. Please choose another time.')
        await loadSlots()
        setTime('')
        setStep(2)
      } else {
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container-app py-20">
        <LoadingState label="Loading booking details…" />
      </div>
    )
  }

  if (loadError || !doctor) {
    return (
      <div className="container-app py-16">
        <ErrorState
          title="Unable to start booking"
          message={loadError || 'This doctor is not available.'}
          onRetry={loadDoctor}
        />
        <div className="mt-6 text-center">
          <Link to="/doctors" className="btn-outline">
            Back to doctors
          </Link>
        </div>
      </div>
    )
  }

  const doctorName = doctor.user?.name || 'Doctor'
  const specialtyName = doctor.specialty?.name || 'Consultation'

  return (
    <div className="container-app py-8 lg:py-10">
      <Breadcrumbs
        items={[
          { label: 'Find Doctors', to: '/doctors' },
          { label: doctorName, to: `/doctors/${doctor._id}` },
          { label: 'Book appointment' },
        ]}
      />

      <h1 className="text-2xl font-bold sm:text-3xl">Book an appointment</h1>
      <p className="mt-2 text-ink-600">
        Complete the steps below to confirm your visit with {doctorName}.
      </p>

      <div className="mt-8">
        <Stepper steps={STEPS} current={step} onStepClick={setStep} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* ---------- Step panel ---------- */}
        <section className="card card-body" aria-live="polite">
          {/* STEP 1 — Doctor */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Confirm your doctor</h2>
              <p className="mt-1 text-sm text-ink-500">
                Check that this is the clinician you would like to see.
              </p>

              <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-ink-100 bg-ink-50/50 p-4 sm:flex-row sm:items-center">
                <Avatar src={doctor.user?.profileImage} name={doctorName} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-ink-900">{doctorName}</h3>
                  <p className="text-sm font-medium text-brand-700">{specialtyName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-ink-400" aria-hidden="true" />
                      {doctor.experience || 0} yrs
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-ink-400" aria-hidden="true" />
                      {formatCurrency(doctor.consultationFee)}
                    </span>
                  </div>
                  <Rating value={doctor.rating || 0} count={doctor.reviewCount || 0} size="sm" className="mt-2" />
                </div>
              </div>

              <fieldset className="mt-6">
                <legend className="label">Appointment type</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {APPOINTMENT_TYPES.map((type) => {
                    const selected = appointmentType === type.value
                    const TypeIcon = type.value === 'online' ? Video : MapPin
                    return (
                      <label
                        key={type.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                          selected
                            ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/20'
                            : 'border-ink-200 hover:border-brand-300 hover:bg-brand-50/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="appointmentType"
                          value={type.value}
                          checked={selected}
                          onChange={(e) => setAppointmentType(e.target.value)}
                          className="sr-only"
                        />
                        <TypeIcon
                          className={`h-5 w-5 ${selected ? 'text-brand-600' : 'text-ink-400'}`}
                          aria-hidden="true"
                        />
                        <span className={`text-sm font-medium ${selected ? 'text-brand-800' : 'text-ink-700'}`}>
                          {type.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            </div>
          )}

          {/* STEP 2 & 3 — Date and time */}
          {(step === 1 || step === 2) && (
            <div>
              <h2 className="text-lg font-semibold text-ink-900">
                {step === 1 ? 'Choose a date' : 'Choose a time'}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {step === 1
                  ? 'Pick the day you would like to visit.'
                  : 'Only slots that are genuinely free are selectable.'}
              </p>

              <div className="mt-5">
                <SlotPicker
                  selectedDate={date}
                  onSelectDate={(d) => {
                    setDate(d)
                    setTime('')
                  }}
                  selectedTime={time}
                  onSelectTime={setTime}
                  slots={slots}
                  loading={slotsLoading}
                  error={slotsError}
                  onRetry={loadSlots}
                  offset={offset}
                  onOffsetChange={setOffset}
                />
              </div>
            </div>
          )}

          {/* STEP 4 — Patient details */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Your details</h2>
              <p className="mt-1 text-sm text-ink-500">
                These details are shared with the clinic for this appointment.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="patient-name" className="label">
                    Full name
                  </label>
                  <input id="patient-name" value={user?.name || ''} readOnly className="input bg-ink-50" />
                </div>
                <div>
                  <label htmlFor="patient-email" className="label">
                    Email
                  </label>
                  <input id="patient-email" value={user?.email || ''} readOnly className="input bg-ink-50" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="patient-phone" className="label">
                    Contact number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="patient-phone"
                    type="tel"
                    inputMode="numeric"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="input"
                    aria-describedby="phone-hint"
                  />
                  <p id="phone-hint" className="mt-1.5 text-xs text-ink-400">
                    The clinic uses this number to confirm or reschedule your visit.
                  </p>
                </div>
              </div>

              <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-xs text-ink-500">
                To change your name or email, update them in your{' '}
                <Link to="/dashboard/profile" className="link">
                  profile settings
                </Link>
                .
              </p>
            </div>
          )}

          {/* STEP 5 — Reason */}
          {step === 4 && (
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Reason for your visit</h2>
              <p className="mt-1 text-sm text-ink-500">
                A short description helps the doctor prepare for your consultation.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="reason" className="label">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={200}
                    placeholder="e.g. Persistent cough for two weeks"
                    className="input"
                  />
                  <p className="mt-1.5 text-xs text-ink-400">{reason.length}/200 characters</p>
                </div>

                <div>
                  <label htmlFor="symptoms" className="label">
                    Symptoms or notes <span className="font-normal text-ink-400">(optional)</span>
                  </label>
                  <textarea
                    id="symptoms"
                    rows={4}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    maxLength={500}
                    placeholder="Anything else the doctor should know before your visit…"
                    className="input resize-y"
                  />
                  <p className="mt-1.5 text-xs text-ink-400">{symptoms.length}/500 characters</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 & 7 — Summary / confirm */}
          {(step === 5 || step === 6) && (
            <div>
              <h2 className="text-lg font-semibold text-ink-900">
                {step === 5 ? 'Review your appointment' : 'Confirm your booking'}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {step === 5
                  ? 'Please check every detail before confirming.'
                  : 'Submitting will reserve this slot with the doctor.'}
              </p>

              <dl className="mt-5 divide-y divide-ink-100 rounded-2xl border border-ink-100">
                <div className="flex items-start justify-between gap-4 p-4">
                  <dt className="inline-flex items-center gap-2 text-sm text-ink-500">
                    <Stethoscope className="h-4 w-4" aria-hidden="true" />
                    Doctor
                  </dt>
                  <dd className="text-right text-sm font-medium text-ink-900">
                    {doctorName}
                    <span className="block text-xs font-normal text-ink-500">{specialtyName}</span>
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 p-4">
                  <dt className="inline-flex items-center gap-2 text-sm text-ink-500">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Date
                  </dt>
                  <dd className="text-right text-sm font-medium text-ink-900">{formatDate(date)}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 p-4">
                  <dt className="inline-flex items-center gap-2 text-sm text-ink-500">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    Time
                  </dt>
                  <dd className="text-right text-sm font-medium text-ink-900">{formatTime(time)}</dd>
                </div>
                <div className="flex items-start justify-between gap-4 p-4">
                  <dt className="inline-flex items-center gap-2 text-sm text-ink-500">
                    {appointmentType === 'online' ? (
                      <Video className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    )}
                    Type
                  </dt>
                  <dd className="text-right text-sm font-medium text-ink-900">
                    {appointmentType === 'online' ? 'Online consultation' : 'In-clinic visit'}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 p-4">
                  <dt className="inline-flex items-center gap-2 text-sm text-ink-500">
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                    Patient
                  </dt>
                  <dd className="text-right text-sm font-medium text-ink-900">
                    {user?.name}
                    <span className="block text-xs font-normal text-ink-500">{patientPhone}</span>
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 p-4">
                  <dt className="inline-flex items-center gap-2 text-sm text-ink-500">
                    <ClipboardList className="h-4 w-4" aria-hidden="true" />
                    Reason
                  </dt>
                  <dd className="max-w-[60%] text-right text-sm font-medium text-ink-900">
                    {reason}
                    {symptoms && (
                      <span className="mt-1 block text-xs font-normal text-ink-500">{symptoms}</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4 bg-brand-50/60 p-4">
                  <dt className="inline-flex items-center gap-2 text-sm font-medium text-ink-700">
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    Consultation fee
                  </dt>
                  <dd className="text-right text-base font-bold text-ink-900">
                    {formatCurrency(doctor.consultationFee)}
                  </dd>
                </div>
              </dl>

              {step === 6 && (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Payment is made directly at the clinic. Your slot is held once this booking is
                  confirmed.
                </p>
              )}

              {formError && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {formError}
                </p>
              )}
            </div>
          )}

          {/* ---------- Navigation ---------- */}
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0 || submitting}
              className="btn-outline"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <div className="flex flex-col items-end gap-1.5">
                <button type="button" onClick={goNext} disabled={!canContinue} className="btn-primary">
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                {!canContinue && stepHint && (
                  <p className="text-xs text-ink-400">{stepHint}</p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="btn-primary btn-lg"
              >
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                {submitting ? 'Confirming…' : 'Confirm appointment'}
              </button>
            )}
          </div>
        </section>

        {/* ---------- Sticky summary ---------- */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card card-body">
            <h2 className="text-sm font-semibold text-ink-900">Your selection</h2>

            <div className="mt-4 flex items-center gap-3 border-b border-ink-100 pb-4">
              <Avatar src={doctor.user?.profileImage} name={doctorName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{doctorName}</p>
                <p className="truncate text-xs text-brand-700">{specialtyName}</p>
              </div>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Date</dt>
                <dd className="font-medium text-ink-900">{date ? formatDate(date) : '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Time</dt>
                <dd className="font-medium text-ink-900">{time ? formatTime(time) : '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-500">Type</dt>
                <dd className="font-medium text-ink-900">
                  {appointmentType === 'online' ? 'Online' : 'In-clinic'}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
              <span className="text-sm text-ink-500">Fee</span>
              <span className="text-lg font-bold text-ink-900">
                {formatCurrency(doctor.consultationFee)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
