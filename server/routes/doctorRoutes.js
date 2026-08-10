import express from 'express'
import { body } from 'express-validator'

import {
  createDoctor,
  deleteDoctor,
  getDoctorById,
  getDoctors,
  getDoctorSlots,
  getMyDoctorProfile,
  getMyDoctorStats,
  updateDoctor,
  updateMyAvailability,
  updateMyDoctorProfile,
} from '../controllers/doctorController.js'
import { createReview, getDoctorReviews } from '../controllers/reviewController.js'
import { protect } from '../middleware/authMiddleware.js'
import authorize from '../middleware/roleMiddleware.js'
import validate from '../middleware/validationMiddleware.js'

const router = express.Router()

// ---------- Doctor's own resources ----------
// Declared before '/:id' so "me" is never parsed as an id.
router.get('/me/profile', protect, authorize('doctor'), getMyDoctorProfile)
router.put('/me/profile', protect, authorize('doctor'), updateMyDoctorProfile)
router.put('/me/availability', protect, authorize('doctor'), updateMyAvailability)
router.get('/me/stats', protect, authorize('doctor'), getMyDoctorStats)

// ---------- Public ----------
router.get('/', getDoctors)
router.get('/:id', getDoctorById)
router.get('/:id/slots', getDoctorSlots)

// ---------- Reviews for a doctor ----------
router.get('/:id/reviews', getDoctorReviews)
router.post(
  '/:id/reviews',
  protect,
  authorize('patient'),
  [
    body('appointment').notEmpty().withMessage('An appointment reference is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Choose a rating between 1 and 5'),
    body('comment').optional().isLength({ max: 500 }).withMessage('Comment must be under 500 characters'),
  ],
  validate,
  createReview,
)

// ---------- Admin ----------
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter the doctor’s full name'),
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Enter a valid 10-digit phone number'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('specialty').notEmpty().withMessage('Specialty is required'),
    body('qualification').trim().notEmpty().withMessage('Qualification is required'),
    body('experience').isInt({ min: 0, max: 70 }).withMessage('Enter valid years of experience'),
    body('consultationFee').isFloat({ min: 0 }).withMessage('Enter a valid consultation fee'),
  ],
  validate,
  createDoctor,
)

router.put('/:id', protect, authorize('admin'), updateDoctor)
router.delete('/:id', protect, authorize('admin'), deleteDoctor)

export default router
