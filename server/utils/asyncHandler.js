/**
 * Wraps an async route handler so a rejected promise reaches the Express
 * error middleware instead of hanging the request.
 */
export default function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
