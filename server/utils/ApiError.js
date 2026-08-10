/** Error carrying an HTTP status, thrown by controllers and handled centrally. */
export default class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, details)
  }
  static unauthorized(message = 'Not authorised') {
    return new ApiError(401, message)
  }
  static forbidden(message = 'You do not have permission to do that') {
    return new ApiError(403, message)
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message)
  }
  static conflict(message = 'That action conflicts with existing data') {
    return new ApiError(409, message)
  }
}
