import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'

/**
 * Verifies the bearer token and attaches the current user to req.user.
 * Rejects tokens whose user was deleted or whose account has been disabled.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  let token

  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1]
  } else if (req.cookies?.token) {
    token = req.cookies.token
  }

  if (!token) {
    throw ApiError.unauthorized('You must be logged in to access this resource')
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    throw ApiError.unauthorized('Your session is invalid or has expired')
  }

  const user = await User.findById(decoded.id)
  if (!user) {
    throw ApiError.unauthorized('The account for this session no longer exists')
  }
  if (user.isActive === false) {
    throw ApiError.forbidden('This account has been disabled. Please contact support.')
  }

  req.user = user
  return next()
})

/**
 * Attaches req.user when a valid token is present, but never rejects.
 * Used on public endpoints that show extra detail to signed-in users.
 */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next()

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (user && user.isActive !== false) req.user = user
  } catch {
    /* an invalid token simply means "treat as anonymous" here */
  }

  return next()
})
