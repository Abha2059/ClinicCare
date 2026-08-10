import express from 'express'
import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'

import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPassword,
  updateProfile,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import validate from '../middleware/validationMiddleware.js'

const router = express.Router()

/**
 * Credential endpoints are rate limited to blunt brute-force attempts.
 * Deliberately generous so ordinary use is never blocked.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Strict in production; relaxed in development so local testing is not throttled.
  max: process.env.NODE_ENV === 'production' ? 30 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
})

const passwordRules = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Za-z]/)
  .withMessage('Password must include at least one letter')
  .matches(/[0-9]/)
  .withMessage('Password must include at least one number')

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your full name'),
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Enter a valid 10-digit phone number'),
    passwordRules,
  ],
  validate,
  register,
)

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login,
)

router.post('/logout', logout)

router.get('/me', protect, getMe)

router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Enter your full name'),
    body('phone')
      .optional()
      .matches(/^[0-9]{10}$/)
      .withMessage('Enter a valid 10-digit phone number'),
    body('profileImage').optional({ values: 'falsy' }).isURL().withMessage('Enter a valid image URL'),
  ],
  validate,
  updateProfile,
)

router.put(
  '/password',
  protect,
  [body('currentPassword').notEmpty().withMessage('Enter your current password'), passwordRules],
  validate,
  changePassword,
)

router.post(
  '/forgot-password',
  authLimiter,
  [body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail()],
  validate,
  forgotPassword,
)

router.post('/reset-password/:token', authLimiter, [passwordRules], validate, resetPassword)

export default router
