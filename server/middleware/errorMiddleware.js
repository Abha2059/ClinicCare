import ApiError from '../utils/ApiError.js'

/** 404 handler for unmatched routes. */
export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`))
}

/**
 * Central error handler. Every thrown error ends up here and is translated
 * into a consistent JSON shape: { success: false, message, errors? }.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Something went wrong on our side'
  let errors = err.details

  // Mongoose: malformed ObjectId
  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid ${err.path}: ${err.value}`
  }

  // Mongoose: schema validation
  if (err.name === 'ValidationError') {
    statusCode = 400
    errors = Object.values(err.errors).map((e) => ({ field: e.path, msg: e.message }))
    message = errors[0]?.msg || 'Validation failed'
  }

  // MongoDB: duplicate key
  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyPattern || {})[0]

    // The partial unique index on (doctor, date, time) is the last line of
    // defence against double booking — surface it as a clear, actionable 409.
    if (err.keyPattern?.doctor && err.keyPattern?.appointmentTime) {
      message = 'That time slot has just been booked. Please choose another time.'
    } else if (field === 'email') {
      message = 'An account with that email address already exists'
    } else if (field === 'appointment') {
      message = 'You have already reviewed this appointment'
    } else if (field) {
      message = `That ${field} is already in use`
    } else {
      message = 'That record already exists'
    }
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Your session is invalid'
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Your session has expired. Please log in again.'
  }

  // Unexpected failures are logged in full; clients get a generic message.
  if (statusCode >= 500) {
    console.error('[error]', err)
    if (process.env.NODE_ENV === 'production') {
      message = 'Something went wrong on our side'
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(process.env.NODE_ENV !== 'production' && statusCode >= 500
      ? { stack: err.stack }
      : {}),
  })
}
