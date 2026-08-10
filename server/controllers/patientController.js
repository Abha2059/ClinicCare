import User from '../models/User.js'
import Appointment from '../models/Appointment.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * GET /api/patients/:id — admin, or the patient themselves.
 * Returns the account plus a short appointment history.
 */
export const getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const isSelf = String(req.user._id) === String(id)
  if (!isSelf && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only view your own patient record')
  }

  const patient = await User.findOne({ _id: id, role: 'patient' })
  if (!patient) throw ApiError.notFound('Patient not found')

  const appointments = await Appointment.find({ patient: id })
    .populate({
      path: 'doctor',
      select: 'user specialty',
      populate: [
        { path: 'user', select: 'name profileImage' },
        { path: 'specialty', select: 'name slug' },
      ],
    })
    .sort({ appointmentDate: -1 })
    .limit(20)
    .lean()

  res.json({ success: true, patient, appointments })
})

/** GET /api/patients — admin only. */
export const getPatients = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))

  const filter = { role: 'patient' }
  if (req.query.search) {
    const safe = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(safe, 'i')
    filter.$or = [{ name: regex }, { email: regex }]
  }

  const [patients, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ])

  res.json({
    success: true,
    patients,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})
