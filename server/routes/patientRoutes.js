import express from 'express'

import { getPatientById, getPatients } from '../controllers/patientController.js'
import { protect } from '../middleware/authMiddleware.js'
import authorize from '../middleware/roleMiddleware.js'

const router = express.Router()

router.get('/', protect, authorize('admin'), getPatients)
router.get('/:id', protect, getPatientById)

export default router
