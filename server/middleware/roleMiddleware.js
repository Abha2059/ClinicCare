import ApiError from '../utils/ApiError.js'

/**
 * Restricts a route to the given roles.
 * Must run after `protect`, which populates req.user.
 */
export default function authorize(...roles) {
  return function checkRole(req, _res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized('You must be logged in to access this resource'))
    }
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`This action requires ${roles.join(' or ')} access`),
      )
    }
    return next()
  }
}

export const adminOnly = authorize('admin')
export const doctorOnly = authorize('doctor')
export const patientOnly = authorize('patient')
