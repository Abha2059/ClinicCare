import express from 'express'
import { body } from 'express-validator'

import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  getAppointments,
  getAppointmentStats,
  updateAppointment,
} from '../controllers/appointmentController.js'
import { protect } from '../middleware/authMiddleware.js'
import authorize from '../middleware/roleMiddleware.js'
import validate from '../middleware/validationMiddleware.js'

const router = express.Router()

// Every appointment route requires a signed-in user.
router.use(protect)

// Declared before '/:id' so "stats" is never parsed as an id.
router.get('/stats/summary', getAppointmentStats)

router.post(
  '/',
  authorize('patient'),
  [
    body('doctor').notEmpty().withMessage('A doctor must be selected'),
    body('appointmentDate')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Provide a date in YYYY-MM-DD format'),
    body('appointmentTime')
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage('Provide a time in HH:MM format'),
    body('appointmentType')
      .optional()
      .isIn(['in-clinic', 'online'])
      .withMessage('Choose a valid appointment type'),
    body('reason')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Describe your reason in 5 to 200 characters'),
    body('symptoms').optional().isLength({ max: 500 }).withMessage('Symptoms must be under 500 characters'),
    body('patientPhone')
      .optional({ values: 'falsy' })
      .matches(/^[0-9]{10}$/)
      .withMessage('Enter a valid 10-digit phone number'),
  ],
  validate,
  createAppointment,
)

router.get('/', getAppointments)
router.get('/:id', getAppointmentById)

router.put(
  '/:id',
  [
    body('status')
      .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'rejected'])
      .withMessage('Choose a valid appointment status'),
  ],
  validate,
  updateAppointment,
)

router.delete('/:id', authorize('admin'), deleteAppointment)

export default router
