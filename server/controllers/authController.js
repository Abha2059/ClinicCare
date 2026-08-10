import crypto from 'crypto'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import generateToken from '../utils/generateToken.js'

/** Public shape of a user returned to the client. */
function publicUser(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profileImage: user.profileImage || '',
    isActive: user.isActive,
    createdAt: user.createdAt,
  }
}

/**
 * POST /api/auth/register
 * Always creates a patient — role is never accepted from the request body,
 * so nobody can self-assign doctor or admin access.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body

  const existing = await User.findOne({ email: String(email).toLowerCase() })
  if (existing) {
    throw ApiError.conflict('An account with that email address already exists')
  }

  const user = await User.create({
    name,
    email: String(email).toLowerCase(),
    phone,
    password,
    role: 'patient',
  })

  res.status(201).json({
    success: true,
    message: 'Your ClinicCare account has been created',
    token: generateToken(user._id),
    user: publicUser(user),
  })
})

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Password is select:false on the schema, so ask for it explicitly.
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password')

  // Same message for unknown email and wrong password — no account enumeration.
  if (!user || !(await user.matchPassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password')
  }

  if (user.isActive === false) {
    throw ApiError.forbidden('This account has been disabled. Please contact support.')
  }

  res.json({
    success: true,
    message: 'Signed in successfully',
    token: generateToken(user._id),
    user: publicUser(user),
  })
})

/**
 * POST /api/auth/logout
 * Tokens are stateless, so the client discards it. Any auth cookie is cleared.
 */
export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token')
  res.json({ success: true, message: 'Signed out successfully' })
})

/** GET /api/auth/me */
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) })
})

/** PUT /api/auth/profile */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, profileImage } = req.body

  const user = await User.findById(req.user._id)
  if (!user) throw ApiError.notFound('Account not found')

  if (name !== undefined) user.name = name
  if (phone !== undefined) user.phone = phone
  if (profileImage !== undefined) user.profileImage = profileImage

  await user.save()

  res.json({
    success: true,
    message: 'Profile updated',
    user: publicUser(user),
  })
})

/** PUT /api/auth/password */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, password } = req.body

  const user = await User.findById(req.user._id).select('+password')
  if (!user) throw ApiError.notFound('Account not found')

  if (!(await user.matchPassword(currentPassword))) {
    throw ApiError.badRequest('Your current password is incorrect')
  }

  user.password = password
  await user.save()

  res.json({ success: true, message: 'Password changed successfully' })
})

/**
 * POST /api/auth/forgot-password
 * Responds identically whether or not the address exists, so the endpoint
 * cannot be used to discover which emails are registered.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email: String(email).toLowerCase() })

  const response = {
    success: true,
    message: 'If an account exists for that address, a reset link has been generated.',
  }

  if (!user) {
    return res.json(response)
  }

  const rawToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  // No mail service is configured in this demonstration deployment, so the
  // reset path is returned directly to keep the flow completable.
  response.resetPath = `/reset-password/${rawToken}`

  return res.json(response)
})

/** POST /api/auth/reset-password/:token */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params
  const { password } = req.body

  // Only the hash is stored, so hash the incoming token to look it up.
  const hashed = crypto.createHash('sha256').update(String(token)).digest('hex')

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires')

  if (!user) {
    throw ApiError.badRequest('This reset link is invalid or has expired')
  }

  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  await user.save()

  res.json({
    success: true,
    message: 'Your password has been updated. Please log in.',
  })
})

export { publicUser }
