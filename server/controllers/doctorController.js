import mongoose from 'mongoose'
import Doctor from '../models/Doctor.js'
import User from '../models/User.js'
import Specialty from '../models/Specialty.js'
import Appointment, { BLOCKING_STATUSES } from '../models/Appointment.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  isPastSlot,
  isValidDateKey,
  todayKey,
  weekdayKeyFor,
} from '../utils/dateUtils.js'

const SORT_MAP = {
  rating: { rating: -1, reviewCount: -1 },
  experience: { experience: -1 },
  fee_low: { consultationFee: 1 },
  fee_high: { consultationFee: -1 },
}

/**
 * GET /api/doctors
 * Public directory with search, filtering, sorting and pagination.
 * Only verified doctors with active accounts are listed.
 */
export const getDoctors = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 9))
  const skip = (page - 1) * limit

  const filter = { isVerified: true }

  // Specialty may arrive as a slug (from the UI) or an id.
  if (req.query.specialty) {
    const specialty = mongoose.isValidObjectId(req.query.specialty)
      ? await Specialty.findById(req.query.specialty).select('_id')
      : await Specialty.findOne({ slug: req.query.specialty }).select('_id')

    // An unknown specialty must return no doctors, not every doctor.
    if (!specialty) {
      return res.json({ success: true, doctors: [], total: 0, page, totalPages: 0 })
    }
    filter.specialty = specialty._id
  }

  if (req.query.minExperience) filter.experience = { $gte: Number(req.query.minExperience) }
  if (req.query.minRating) filter.rating = { $gte: Number(req.query.minRating) }
  if (req.query.maxFee) filter.consultationFee = { $lte: Number(req.query.maxFee) }

  // Free-text search spans the doctor's own fields and their user's name,
  // so resolve matching users first.
  if (req.query.search) {
    const term = String(req.query.search).trim()
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(safe, 'i')

    const matchingUsers = await User.find({ name: regex, role: 'doctor' }).select('_id')
    filter.$or = [
      { user: { $in: matchingUsers.map((u) => u._id) } },
      { qualification: regex },
      { expertise: regex },
      { bio: regex },
    ]
  }

  const sort = SORT_MAP[req.query.sort] || SORT_MAP.rating

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .populate('user', 'name email profileImage isActive')
      .populate('specialty', 'name slug icon')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(filter),
  ])

  // Exclude doctors whose user account was disabled after verification.
  const visible = doctors.filter((d) => d.user && d.user.isActive !== false)

  res.json({
    success: true,
    doctors: visible,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

/** GET /api/doctors/:id */
export const getDoctorById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('That doctor id is not valid')
  }

  const doctor = await Doctor.findById(req.params.id)
    .populate('user', 'name email profileImage isActive')
    .populate('specialty', 'name slug icon description conditions')

  if (!doctor || !doctor.user || doctor.user.isActive === false) {
    throw ApiError.notFound('Doctor not found')
  }

  res.json({ success: true, doctor })
})

/**
 * GET /api/doctors/:id/slots?date=YYYY-MM-DD
 * Returns every slot for the day with an `available` flag.
 * This is the single source of truth the booking UI renders from.
 */
export const getDoctorSlots = asyncHandler(async (req, res) => {
  const { id } = req.params
  const date = req.query.date || todayKey()

  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest('That doctor id is not valid')
  }
  if (!isValidDateKey(date)) {
    throw ApiError.badRequest('Provide a date in YYYY-MM-DD format')
  }

  const doctor = await Doctor.findById(id)
  if (!doctor) throw ApiError.notFound('Doctor not found')

  // A blocked date has no slots at all.
  if ((doctor.unavailableDates || []).includes(date)) {
    return res.json({
      success: true,
      date,
      slots: [],
      reason: 'The doctor is not available on this date',
    })
  }

  const allSlots = doctor.getSlotsForWeekday(weekdayKeyFor(date))
  if (allSlots.length === 0) {
    return res.json({
      success: true,
      date,
      slots: [],
      reason: 'The doctor does not consult on this day',
    })
  }

  // Slots already held by a pending/confirmed/completed appointment.
  const taken = await Appointment.find({
    doctor: id,
    appointmentDate: date,
    status: { $in: BLOCKING_STATUSES },
  }).select('appointmentTime')

  const takenTimes = new Set(taken.map((a) => a.appointmentTime))

  const slots = allSlots.map((time) => ({
    time,
    // A slot is bookable only if nobody holds it and it has not already passed.
    available: !takenTimes.has(time) && !isPastSlot(date, time),
  }))

  res.json({ success: true, date, slots })
})

/** GET /api/doctors/me/profile — the signed-in doctor's own record. */
export const getMyDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id })
    .populate('user', 'name email phone profileImage')
    .populate('specialty', 'name slug icon')

  if (!doctor) {
    throw ApiError.notFound('No doctor profile is linked to this account')
  }

  res.json({ success: true, doctor })
})

/** PUT /api/doctors/me/profile */
export const updateMyDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id })
  if (!doctor) throw ApiError.notFound('No doctor profile is linked to this account')

  const editable = [
    'specialty',
    'qualification',
    'experience',
    'languages',
    'bio',
    'expertise',
    'consultationFee',
  ]

  for (const field of editable) {
    if (req.body[field] !== undefined) doctor[field] = req.body[field]
  }

  // Verification status is never self-assignable.
  await doctor.save()
  await doctor.populate([
    { path: 'user', select: 'name email phone profileImage' },
    { path: 'specialty', select: 'name slug icon' },
  ])

  res.json({ success: true, message: 'Profile updated', doctor })
})

/** PUT /api/doctors/me/availability */
export const updateMyAvailability = asyncHandler(async (req, res) => {
  const { availability, slotDuration, unavailableDates } = req.body

  const doctor = await Doctor.findOne({ user: req.user._id })
  if (!doctor) throw ApiError.notFound('No doctor profile is linked to this account')

  if (availability) doctor.availability = availability
  if (slotDuration !== undefined) doctor.slotDuration = slotDuration
  if (unavailableDates !== undefined) {
    const invalid = unavailableDates.find((d) => !isValidDateKey(d))
    if (invalid) throw ApiError.badRequest(`"${invalid}" is not a valid YYYY-MM-DD date`)
    doctor.unavailableDates = [...new Set(unavailableDates)].sort()
  }

  await doctor.save()

  res.json({ success: true, message: 'Availability updated', doctor })
})

/** GET /api/doctors/me/stats — counters for the doctor dashboard. */
export const getMyDoctorStats = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id })
  if (!doctor) throw ApiError.notFound('No doctor profile is linked to this account')

  const today = todayKey()

  const [total, todayCount, pending, upcoming, completed, cancelled] = await Promise.all([
    Appointment.countDocuments({ doctor: doctor._id }),
    Appointment.countDocuments({
      doctor: doctor._id,
      appointmentDate: today,
      status: { $in: ['pending', 'confirmed'] },
    }),
    Appointment.countDocuments({ doctor: doctor._id, status: 'pending' }),
    Appointment.countDocuments({
      doctor: doctor._id,
      appointmentDate: { $gte: today },
      status: { $in: ['pending', 'confirmed'] },
    }),
    Appointment.countDocuments({ doctor: doctor._id, status: 'completed' }),
    Appointment.countDocuments({
      doctor: doctor._id,
      status: { $in: ['cancelled', 'rejected'] },
    }),
  ])

  res.json({
    success: true,
    stats: {
      total,
      today: todayCount,
      pending,
      upcoming,
      completed,
      cancelled,
      rating: doctor.rating,
      reviewCount: doctor.reviewCount,
    },
  })
})

/**
 * POST /api/doctors — admin only.
 * Creates the user account and its linked doctor profile together.
 */
export const createDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    specialty,
    qualification,
    experience,
    consultationFee,
    languages,
    bio,
    expertise,
    isVerified,
  } = req.body

  const existing = await User.findOne({ email: String(email).toLowerCase() })
  if (existing) throw ApiError.conflict('An account with that email address already exists')

  const specialtyDoc = await Specialty.findById(specialty)
  if (!specialtyDoc) throw ApiError.badRequest('That specialty does not exist')

  const user = await User.create({
    name,
    email: String(email).toLowerCase(),
    phone,
    password,
    role: 'doctor',
  })

  try {
    const doctor = await Doctor.create({
      user: user._id,
      specialty,
      qualification,
      experience,
      consultationFee,
      languages,
      bio,
      expertise,
      isVerified: Boolean(isVerified),
    })

    await doctor.populate([
      { path: 'user', select: 'name email phone profileImage' },
      { path: 'specialty', select: 'name slug icon' },
    ])

    res.status(201).json({ success: true, message: 'Doctor created', doctor })
  } catch (err) {
    // Don't leave an orphaned user account behind if the profile fails validation.
    await User.findByIdAndDelete(user._id)
    throw err
  }
})

/** PUT /api/doctors/:id — admin only. */
export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
  if (!doctor) throw ApiError.notFound('Doctor not found')

  const editable = [
    'specialty',
    'qualification',
    'experience',
    'languages',
    'bio',
    'expertise',
    'consultationFee',
    'isVerified',
    'availability',
    'slotDuration',
  ]

  for (const field of editable) {
    if (req.body[field] !== undefined) doctor[field] = req.body[field]
  }

  await doctor.save()
  await doctor.populate([
    { path: 'user', select: 'name email phone profileImage' },
    { path: 'specialty', select: 'name slug icon' },
  ])

  res.json({ success: true, message: 'Doctor updated', doctor })
})

/**
 * DELETE /api/doctors/:id — admin only.
 * Removes the profile, its linked account and any appointments.
 */
export const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
  if (!doctor) throw ApiError.notFound('Doctor not found')

  await Promise.all([
    Appointment.deleteMany({ doctor: doctor._id }),
    User.findByIdAndDelete(doctor.user),
  ])
  await Doctor.findByIdAndDelete(doctor._id)

  res.json({ success: true, message: 'Doctor removed' })
})
