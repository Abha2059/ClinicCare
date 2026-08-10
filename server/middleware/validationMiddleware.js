import { validationResult } from 'express-validator'
import ApiError from '../utils/ApiError.js'

/**
 * Turns express-validator results into a single 400 response.
 * Place after the validation chain on any route that uses one.
 */
export default function validate(req, _res, next) {
  const result = validationResult(req)
  if (result.isEmpty()) return next()

  const errors = result.array().map((e) => ({
    field: e.path ?? e.param,
    msg: e.msg,
  }))

  return next(new ApiError(400, errors[0].msg, errors))
}
