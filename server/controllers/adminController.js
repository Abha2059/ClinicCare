import User from '../models/User.js'
import Doctor from '../models/Doctor.js'
import Specialty from '../models/Specialty.js'
import Appointment from '../models/Appointment.js'
import Review from '../models/Review.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { todayKey } from '../utils/dateUtils.js'

/** Escape user input before using it in a RegExp. */
function searchRegex(term) {
  const safe = String(term).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(safe, 'i')
}

/** GET /api/admin/stats — platform-wide dashboard figures. */
export const getStats = asyncHandler(async (_req, res) => {
  const [
    totalPatients,
    totalDoctors,
    verifiedDoctors,
    totalAppointments,
    pendingAppointments,
    completedAppointments,
    cancelledAppointments,
    totalSpecialties,
    totalReviews,
    todayAppointments,
  ] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Doctor.countDocuments(),
    Doctor.countDocuments({ isVerified: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'pending' }),
    Appointment.countDocuments({ status: 'completed' }),
    Appointment.countDocuments({ status: { $in: ['cancelled', 'rejected'] } }),
    Specialty.countDocuments(),
    Review.countDocuments(),
    Appointment.countDocuments({ appointmentDate: todayKey() }),
  ])

  // Appointment volume for the last six months, oldest first.
  const monthly = await buildMonthlyTrend()

  // Busiest specialties by appointment count.
  const bySpecialtyRaw = await Appointment.aggregate([
    { $group: { _id: '$specialty', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 },
    {
      $lookup: {
        from: 'specialties',
        localField: '_id',
        foreignField: '_id',
        as: 'specialty',
      },
    },
    { $unwind: { path: '$specialty', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, name: { $ifNull: ['$specialty.name', 'Unassigned'] }, count: 1 } },
  ])

  const recentAppointments = await Appointment.find()
    .populate('patient', 'name email profileImage')
    .populate({
      path: 'doctor',
      select: 'user',
      populate: { path: 'user', select: 'name profileImage' },
    })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean()

  res.json({
    success: true,
    stats: {
      totalPatients,
      totalDoctors,
      verifiedDoctors,
      unverifiedDoctors: totalDoctors - verifiedDoctors,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      totalSpecialties,
      totalReviews,
      todayAppointments,
      monthly,
      bySpecialty: bySpecialtyRaw,
      recentAppointments,
    },
  })
})

/** Appointments created per month over the last six months. */
async function buildMonthlyTrend() {
  const start = new Date()
  start.setMonth(start.getMonth() - 5)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const rows = await Appointment.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
  ])

  const map = new Map(rows.map((r) => [`${r._id.year}-${r._id.month}`, r.count]))
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Emit an entry for every month in the window, including empty ones.
  const out = []
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(start)
    d.setMonth(start.getMonth() + i)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    out.push({ label: labels[d.getMonth()], value: map.get(key) || 0 })
  }
  return out
}

/** GET /api/admin/users */
export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))

  const filter = {}
  if (req.query.role) filter.role = req.query.role
  if (req.query.search) {
    const regex = searchRegex(req.query.search)
    filter.$or = [{ name: regex }, { email: regex }]
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ])

  res.json({
    success: true,
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

/** GET /api/admin/doctors — includes unverified profiles. */
export const getDoctors = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10))

  const filter = {}

  if (req.query.specialty) {
    const specialty = await Specialty.findOne({ slug: req.query.specialty }).select('_id')
    if (!specialty) {
      return res.json({ success: true, doctors: [], total: 0, page, totalPages: 0 })
    }
    filter.specialty = specialty._id
  }

  if (req.query.isVerified === 'true') filter.isVerified = true
  if (req.query.isVerified === 'false') filter.isVerified = false

  if (req.query.search) {
    const regex = searchRegex(req.query.search)
    const users = await User.find({
      role: 'doctor',
      $or: [{ name: regex }, { email: regex }],
    }).select('_id')
    filter.user = { $in: users.map((u) => u._id) }
  }

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .populate('user', 'name email phone profileImage isActive createdAt')
      .populate('specialty', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Doctor.countDocuments(filter),
  ])

  res.json({
    success: true,
    doctors,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

/** GET /api/admin/patients — patient accounts with their appointment counts. */
export const getPatients = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10))

  const filter = { role: 'patient' }
  if (req.query.search) {
    const regex = searchRegex(req.query.search)
    filter.$or = [{ name: regex }, { email: regex }]
  }

  const [patients, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ])

  // Attach appointment counts in one aggregate rather than per patient.
  const ids = patients.map((p) => p._id)
  const counts = await Appointment.aggregate([
    { $match: { patient: { $in: ids } } },
    { $group: { _id: '$patient', count: { $sum: 1 } } },
  ])
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]))

  res.json({
    success: true,
    patients: patients.map((p) => ({
      ...p,
      appointmentCount: countMap.get(String(p._id)) || 0,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

/** GET /api/admin/appointments — every appointment on the platform. */
export const getAppointments = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 12))

  const filter = {}
  if (req.query.status) filter.status = req.query.status
  if (req.query.date) filter.appointmentDate = req.query.date

  if (req.query.search) {
    const regex = searchRegex(req.query.search)
    const users = await User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id role')

    const patientIds = users.filter((u) => u.role === 'patient').map((u) => u._id)
    const doctorUserIds = users.filter((u) => u.role === 'doctor').map((u) => u._id)
    const doctors = await Doctor.find({ user: { $in: doctorUserIds } }).select('_id')

    filter.$or = [{ patient: { $in: patientIds } }, { doctor: { $in: doctors.map((d) => d._id) } }]
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patient', 'name email profileImage')
      .populate({
        path: 'doctor',
        select: 'user specialty consultationFee',
        populate: [
          { path: 'user', select: 'name email profileImage' },
          { path: 'specialty', select: 'name slug' },
        ],
      })
      .populate('specialty', 'name slug')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
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

/** PUT /api/admin/doctors/:id/verify */
export const setDoctorVerification = asyncHandler(async (req, res) => {
  const { isVerified } = req.body

  const doctor = await Doctor.findById(req.params.id)
  if (!doctor) throw ApiError.notFound('Doctor not found')

  doctor.isVerified = Boolean(isVerified)
  await doctor.save()

  res.json({
    success: true,
    message: doctor.isVerified ? 'Doctor verified' : 'Verification removed',
    doctor,
  })
})

/** PUT /api/admin/users/:id/status — enable or disable an account. */
export const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body

  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('User not found')

  // An admin must not lock themselves out.
  if (String(user._id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot disable your own account')
  }

  user.isActive = Boolean(isActive)
  await user.save()

  res.json({
    success: true,
    message: user.isActive ? 'Account enabled' : 'Account disabled',
    user,
  })
})

/** DELETE /api/admin/users/:id */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('User not found')

  if (String(user._id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account')
  }

  // Remove everything that references this account.
  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: user._id })
    if (doctor) {
      await Appointment.deleteMany({ doctor: doctor._id })
      await Review.deleteMany({ doctor: doctor._id })
      await Doctor.findByIdAndDelete(doctor._id)
    }
  } else {
    await Appointment.deleteMany({ patient: user._id })
    await Review.deleteMany({ patient: user._id })
  }

  await User.findByIdAndDelete(user._id)

  res.json({ success: true, message: 'Account removed' })
})
