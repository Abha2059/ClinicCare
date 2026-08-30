import crypto from 'crypto'
import mongoose from 'mongoose'
import Appointment, { BLOCKING_STATUSES } from '../models/Appointment.js'
import Doctor from '../models/Doctor.js'
import Review from '../models/Review.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { sendAppointmentEmail } from '../utils/mailer.js'
import {
  isPastSlot,
  isValidDateKey,
  todayKey,
  weekdayKeyFor,
} from '../utils/dateUtils.js'

const POPULATE = [
  { path: 'patient', select: 'name email phone profileImage' },
  {
    path: 'doctor',
    select: 'user specialty consultationFee',
    populate: [
      { path: 'user', select: 'name email profileImage' },
      { path: 'specialty', select: 'name slug icon' },
    ],
  },
  { path: 'specialty', select: 'name slug icon' },
]

const SORT_MAP = {
  date_asc: { appointmentDate: 1, appointmentTime: 1 },
  date_desc: { appointmentDate: -1, appointmentTime: -1 },
  time_asc: { appointmentTime: 1 },
  created_desc: { createdAt: -1 },
}

/**
 * POST /api/appointments
 *
 * Server-side booking. Every constraint is re-checked here regardless of what
 * the client sent, and the unique slot index provides the final guarantee.
 */
export const createAppointment = asyncHandler(async (req, res) => {
  const {
    doctor: doctorId,
    appointmentDate,
    appointmentTime,
    appointmentType,
    reason,
    symptoms,
    patientPhone,
    paymentMethod,
  } = req.body

  if (!mongoose.isValidObjectId(doctorId)) {
    throw ApiError.badRequest('That doctor id is not valid')
  }
  if (!isValidDateKey(appointmentDate)) {
    throw ApiError.badRequest('Provide an appointment date in YYYY-MM-DD format')
  }

  const doctor = await Doctor.findById(doctorId).populate('user', 'isActive')
  if (!doctor) throw ApiError.notFound('Doctor not found')
  if (!doctor.isVerified || doctor.user?.isActive === false) {
    throw ApiError.badRequest('This doctor is not currently accepting appointments')
  }

  // 1. The date must not be in the past, and the slot must not have passed today.
  if (isPastSlot(appointmentDate, appointmentTime)) {
    throw ApiError.badRequest('That appointment time has already passed')
  }

  // 2. The doctor must not have blocked this specific date.
  if ((doctor.unavailableDates || []).includes(appointmentDate)) {
    throw ApiError.badRequest('The doctor is not available on that date')
  }

  // 3. The time must be a real slot inside the doctor's consulting hours —
  //    never trust a time the client invented.
  const validSlots = doctor.getSlotsForWeekday(weekdayKeyFor(appointmentDate))
  if (validSlots.length === 0) {
    throw ApiError.badRequest('The doctor does not consult on that day')
  }
  if (!validSlots.includes(appointmentTime)) {
    throw ApiError.badRequest('That time is not one of the doctor’s consulting slots')
  }

  // 4. The slot must not already be held. This read-time check gives a clean
  //    error; the unique index below catches anything that races past it.
  const clash = await Appointment.findOne({
    doctor: doctorId,
    appointmentDate,
    appointmentTime,
    status: { $in: BLOCKING_STATUSES },
  })
  if (clash) {
    throw ApiError.conflict('That time slot is already booked. Please choose another time.')
  }

  // 5. The same patient must not hold two appointments at the same moment.
  const patientClash = await Appointment.findOne({
    patient: req.user._id,
    appointmentDate,
    appointmentTime,
    status: { $in: BLOCKING_STATUSES },
  })
  if (patientClash) {
    throw ApiError.conflict('You already have another appointment at that time')
  }

  // 6. Payment. The client states how it wants to pay; whether that counts as
  //    settled is decided here, never taken from the request body.
  const method = paymentMethod === 'upi' ? 'upi' : 'pay-at-clinic'
  const isPrepaid = method === 'upi'

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctorId,
    specialty: doctor.specialty,
    appointmentDate,
    appointmentTime,
    appointmentType: appointmentType || 'in-clinic',
    reason,
    symptoms: symptoms || '',
    patientPhone: patientPhone || req.user.phone,
    consultationFee: doctor.consultationFee,
    status: 'pending',
    paymentMethod: method,
    paymentStatus: isPrepaid ? 'paid' : 'pending',
    paymentReference: isPrepaid ? buildPaymentReference() : '',
    paidAt: isPrepaid ? new Date() : undefined,
  })

  await appointment.populate(POPULATE)

  // Let the patient know the request is in and awaiting the admin's review,
  // and tell the clinic inbox a new request needs triage. Awaited so the
  // sends survive serverless hosts, which freeze once the response goes out;
  // the mailer never rejects, so a mail problem cannot fail the booking.
  await Promise.all([
    sendAppointmentEmail('submitted', appointment),
    sendAppointmentEmail('adminNewRequest', appointment, process.env.EMAIL_USER),
  ])

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    appointment,
  })
})

/**
 * GET /api/appointments
 * Role-aware: patients see their own, doctors see theirs, admins see all.
 */
export const getAppointments = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10))
  const skip = (page - 1) * limit

  const filter = {}

  if (req.user.role === 'patient') {
    filter.patient = req.user._id
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id }).select('_id')
    if (!doctor) throw ApiError.notFound('No doctor profile is linked to this account')
    filter.doctor = doctor._id
  }
  // Admins get an unfiltered view.

  if (req.query.status) filter.status = req.query.status
  if (req.query.date) filter.appointmentDate = req.query.date

  // "Upcoming" means today or later, and still open.
  if (req.query.upcoming === 'true') {
    filter.appointmentDate = { $gte: todayKey() }
    filter.status = { $in: ['pending', 'confirmed'] }
  }

  const sort = SORT_MAP[req.query.sort] || SORT_MAP.date_desc

  const [appointments, total] = await Promise.all([
    Appointment.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    Appointment.countDocuments(filter),
  ])

  res.json({
    success: true,
    appointments,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

/** GET /api/appointments/:id */
export const getAppointmentById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('That appointment id is not valid')
  }

  const appointment = await Appointment.findById(req.params.id).populate(POPULATE)
  if (!appointment) throw ApiError.notFound('Appointment not found')

  await assertCanAccess(req.user, appointment)

  // Include the patient's own review so the UI knows whether to show the form.
  const review = await Review.findOne({ appointment: appointment._id })

  res.json({ success: true, appointment, review })
})

/**
 * PUT /api/appointments/:id
 * Status transitions, gated by role and by which transitions make sense.
 */
export const updateAppointment = asyncHandler(async (req, res) => {
  const { status, cancellationReason } = req.body

  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) throw ApiError.notFound('Appointment not found')

  await assertCanAccess(req.user, appointment)

  if (!status) throw ApiError.badRequest('A new status is required')

  const role = req.user.role

  // Completed, cancelled and rejected are terminal — except for an admin, who
  // administers the platform and may correct a status that was set in error.
  if (role !== 'admin' && ['completed', 'cancelled', 'rejected'].includes(appointment.status)) {
    throw ApiError.badRequest(`This appointment is already ${appointment.status}`)
  }

  if (role === 'patient') {
    // A patient may only call off their own visit.
    if (status !== 'cancelled') {
      throw ApiError.forbidden('You can only cancel your own appointments')
    }
  } else if (role === 'doctor') {
    const allowed = {
      pending: ['confirmed', 'rejected', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
    }
    if (!allowed[appointment.status]?.includes(status)) {
      throw ApiError.badRequest(
        `An appointment that is ${appointment.status} cannot be changed to ${status}`,
      )
    }
  }
  // Admins may set any status.

  /**
   * Reopening a closed appointment puts it back into the doctor's diary, and
   * the slot may have been given away in the meantime. The unique index only
   * covers active statuses, so this check is what stops a double booking.
   */
  const previousStatus = appointment.status
  const wasClosed = ['cancelled', 'rejected'].includes(appointment.status)
  const isReopening = BLOCKING_STATUSES.includes(status)
  if (wasClosed && isReopening) {
    const clash = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor: appointment.doctor,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: { $in: BLOCKING_STATUSES },
    })
    if (clash) {
      throw ApiError.conflict(
        'That slot has since been booked by someone else, so this appointment cannot be reopened.',
      )
    }
  }

  appointment.status = status
  if (status === 'cancelled' || status === 'rejected') {
    appointment.cancellationReason =
      cancellationReason || (status === 'rejected' ? 'Declined by the doctor' : 'Cancelled')

    // A visit that was paid for online and then called off is owed a refund.
    if (appointment.paymentStatus === 'paid') {
      appointment.paymentStatus = 'refunded'
    }
  } else if (wasClosed) {
    // Back in the diary: the old cancellation note no longer applies, and a
    // refunded prepayment counts as settled again.
    appointment.cancellationReason = ''
    if (appointment.paymentStatus === 'refunded' && appointment.paymentMethod === 'upi') {
      appointment.paymentStatus = 'paid'
    }
  }

  await appointment.save()
  await appointment.populate(POPULATE)

  // Tell the patient their visit is done. Guarded on the transition so an
  // admin re-saving an already-completed appointment does not resend it.
  // Awaited for the same serverless reason as the booking emails.
  if (status === 'completed' && previousStatus !== 'completed') {
    await sendAppointmentEmail('completed', appointment)
  }

  res.json({
    success: true,
    message: `Appointment ${status}`,
    appointment,
  })
})

/** DELETE /api/appointments/:id — admin only. */
export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
  if (!appointment) throw ApiError.notFound('Appointment not found')

  await Review.findOneAndDelete({ appointment: appointment._id })
  await Appointment.findByIdAndDelete(appointment._id)

  res.json({ success: true, message: 'Appointment removed' })
})

/** GET /api/appointments/stats/summary — counters for the patient dashboard. */
export const getAppointmentStats = asyncHandler(async (req, res) => {
  const filter = {}

  if (req.user.role === 'patient') {
    filter.patient = req.user._id
  } else if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id }).select('_id')
    if (!doctor) throw ApiError.notFound('No doctor profile is linked to this account')
    filter.doctor = doctor._id
  }

  const today = todayKey()

  const [total, upcoming, completed, cancelled, pending] = await Promise.all([
    Appointment.countDocuments(filter),
    Appointment.countDocuments({
      ...filter,
      appointmentDate: { $gte: today },
      status: { $in: ['pending', 'confirmed'] },
    }),
    Appointment.countDocuments({ ...filter, status: 'completed' }),
    Appointment.countDocuments({ ...filter, status: { $in: ['cancelled', 'rejected'] } }),
    Appointment.countDocuments({ ...filter, status: 'pending' }),
  ])

  res.json({
    success: true,
    stats: { total, upcoming, completed, cancelled, pending },
  })
})

/**
 * Transaction reference for a settled payment, e.g. "CCPAY-4F91A2C7".
 * A real gateway would supply this; here it is generated locally.
 */
function buildPaymentReference() {
  return `CCPAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

/**
 * Throws unless this user is the patient, the treating doctor, or an admin.
 * Centralised so no endpoint can accidentally leak another patient's record.
 */
async function assertCanAccess(user, appointment) {
  if (user.role === 'admin') return

  if (user.role === 'patient') {
    if (String(appointment.patient?._id || appointment.patient) !== String(user._id)) {
      throw ApiError.forbidden('This appointment does not belong to you')
    }
    return
  }

  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: user._id }).select('_id')
    const appointmentDoctorId = String(appointment.doctor?._id || appointment.doctor)
    if (!doctor || appointmentDoctorId !== String(doctor._id)) {
      throw ApiError.forbidden('This appointment is not with you')
    }
  }
}
