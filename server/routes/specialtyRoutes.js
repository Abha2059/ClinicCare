import express from 'express'
import { body } from 'express-validator'

import {
  createSpecialty,
  deleteSpecialty,
  getSpecialties,
  getSpecialtyById,
  updateSpecialty,
} from '../controllers/specialtyController.js'
import { protect } from '../middleware/authMiddleware.js'
import authorize from '../middleware/roleMiddleware.js'
import validate from '../middleware/validationMiddleware.js'

const router = express.Router()

const specialtyRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter a specialty name'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('conditions').optional().isArray().withMessage('Conditions must be a list'),
]

router.get('/', getSpecialties)
router.get('/:id', getSpecialtyById)

router.post('/', protect, authorize('admin'), specialtyRules, validate, createSpecialty)
router.put('/:id', protect, authorize('admin'), updateSpecialty)
router.delete('/:id', protect, authorize('admin'), deleteSpecialty)

export default router
