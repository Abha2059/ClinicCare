import express from 'express'
import { body } from 'express-validator'

import {
  deleteUser,
  getAppointments,
  getDoctors,
  getPatients,
  getStats,
  getUsers,
  setDoctorVerification,
  setUserActive,
} from '../controllers/adminController.js'
import { protect } from '../middleware/authMiddleware.js'
import authorize from '../middleware/roleMiddleware.js'
import validate from '../middleware/validationMiddleware.js'

const router = express.Router()

// Every admin route is gated by role middleware.
router.use(protect, authorize('admin'))

router.get('/stats', getStats)
router.get('/users', getUsers)
router.get('/doctors', getDoctors)
router.get('/patients', getPatients)
router.get('/appointments', getAppointments)

router.put(
  '/doctors/:id/verify',
  [body('isVerified').isBoolean().withMessage('isVerified must be true or false')],
  validate,
  setDoctorVerification,
)

router.put(
  '/users/:id/status',
  [body('isActive').isBoolean().withMessage('isActive must be true or false')],
  validate,
  setUserActive,
)

router.delete('/users/:id', deleteUser)

export default router
