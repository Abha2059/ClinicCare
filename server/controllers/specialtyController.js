import mongoose from 'mongoose'
import Specialty from '../models/Specialty.js'
import Doctor from '../models/Doctor.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

/** GET /api/specialties — public list with a live doctor count. */
export const getSpecialties = asyncHandler(async (req, res) => {
  const specialties = await Specialty.find().sort({ name: 1 }).lean()

  // Count verified doctors per specialty in one pass rather than N queries.
  const counts = await Doctor.aggregate([
    { $match: { isVerified: true } },
    { $group: { _id: '$specialty', count: { $sum: 1 } } },
  ])
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]))

  res.json({
    success: true,
    specialties: specialties.map((s) => ({
      ...s,
      doctorCount: countMap.get(String(s._id)) || 0,
    })),
    total: specialties.length,
  })
})

/** GET /api/specialties/:idOrSlug */
export const getSpecialtyById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const specialty = mongoose.isValidObjectId(id)
    ? await Specialty.findById(id)
    : await Specialty.findOne({ slug: id })

  if (!specialty) throw ApiError.notFound('Specialty not found')

  const doctorCount = await Doctor.countDocuments({
    specialty: specialty._id,
    isVerified: true,
  })

  res.json({
    success: true,
    specialty: { ...specialty.toJSON(), doctorCount },
  })
})

/** POST /api/specialties — admin only. */
export const createSpecialty = asyncHandler(async (req, res) => {
  const { name, description, conditions, icon } = req.body

  const specialty = await Specialty.create({ name, description, conditions, icon })

  res.status(201).json({ success: true, message: 'Specialty created', specialty })
})

/** PUT /api/specialties/:id — admin only. */
export const updateSpecialty = asyncHandler(async (req, res) => {
  const specialty = await Specialty.findById(req.params.id)
  if (!specialty) throw ApiError.notFound('Specialty not found')

  const { name, description, conditions, icon } = req.body
  if (name !== undefined) specialty.name = name
  if (description !== undefined) specialty.description = description
  if (conditions !== undefined) specialty.conditions = conditions
  if (icon !== undefined) specialty.icon = icon

  await specialty.save()

  res.json({ success: true, message: 'Specialty updated', specialty })
})

/**
 * DELETE /api/specialties/:id — admin only.
 * Refuses while doctors still reference it, so their profiles never break.
 */
export const deleteSpecialty = asyncHandler(async (req, res) => {
  const specialty = await Specialty.findById(req.params.id)
  if (!specialty) throw ApiError.notFound('Specialty not found')

  const doctorCount = await Doctor.countDocuments({ specialty: specialty._id })
  if (doctorCount > 0) {
    throw ApiError.conflict(
      `${doctorCount} doctor${doctorCount === 1 ? ' is' : 's are'} still assigned to this specialty. Reassign them first.`,
    )
  }

  await Specialty.findByIdAndDelete(specialty._id)

  res.json({ success: true, message: 'Specialty removed' })
})
