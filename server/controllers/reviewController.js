import mongoose from 'mongoose'
import Review from '../models/Review.js'
import Doctor from '../models/Doctor.js'
import Appointment from '../models/Appointment.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

/** GET /api/doctors/:id/reviews — public. */
export const getDoctorReviews = asyncHandler(async (req, res) => {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest('That doctor id is not valid')
  }

  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10))

  const [reviews, total] = await Promise.all([
    Review.find({ doctor: id })
      .populate('patient', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments({ doctor: id }),
  ])

  res.json({
    success: true,
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
})

/**
 * POST /api/doctors/:id/reviews — patients only.
 * A review is only accepted for the patient's own completed appointment.
 */
export const createReview = asyncHandler(async (req, res) => {
  const { id: doctorId } = req.params
  const { appointment: appointmentId, rating, comment } = req.body

  if (!mongoose.isValidObjectId(doctorId)) {
    throw ApiError.badRequest('That doctor id is not valid')
  }

  const doctor = await Doctor.findById(doctorId)
  if (!doctor) throw ApiError.notFound('Doctor not found')

  const appointment = await Appointment.findById(appointmentId)
  if (!appointment) throw ApiError.notFound('Appointment not found')

  // The appointment must belong to this patient and this doctor.
  if (String(appointment.patient) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only review your own appointments')
  }
  if (String(appointment.doctor) !== String(doctorId)) {
    throw ApiError.badRequest('That appointment was not with this doctor')
  }
  if (appointment.status !== 'completed') {
    throw ApiError.badRequest('You can only review an appointment once it is completed')
  }

  const existing = await Review.findOne({ appointment: appointmentId })
  if (existing) {
    throw ApiError.conflict('You have already reviewed this appointment')
  }

  // The post-save hook recomputes the doctor's average rating.
  const review = await Review.create({
    patient: req.user._id,
    doctor: doctorId,
    appointment: appointmentId,
    rating,
    comment: comment || '',
  })

  appointment.isReviewed = true
  await appointment.save()

  await review.populate('patient', 'name profileImage')

  res.status(201).json({ success: true, message: 'Review published', review })
})

/** GET /api/reviews/me — reviews written about the signed-in doctor. */
export const getMyReviews = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id }).select('_id')
  if (!doctor) throw ApiError.notFound('No doctor profile is linked to this account')

  const reviews = await Review.find({ doctor: doctor._id })
    .populate('patient', 'name profileImage')
    .sort({ createdAt: -1 })
    .lean()

  res.json({ success: true, reviews, total: reviews.length })
})

/** DELETE /api/reviews/:id — the review's author or an admin. */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
  if (!review) throw ApiError.notFound('Review not found')

  const isOwner = String(review.patient) === String(req.user._id)
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only remove your own review')
  }

  // findOneAndDelete triggers the hook that recomputes the doctor's rating.
  await Review.findOneAndDelete({ _id: review._id })
  await Appointment.findByIdAndUpdate(review.appointment, { isReviewed: false })

  res.json({ success: true, message: 'Review removed' })
})
