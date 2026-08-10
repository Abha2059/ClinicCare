import express from 'express'

import { deleteReview, getMyReviews } from '../controllers/reviewController.js'
import { protect } from '../middleware/authMiddleware.js'
import authorize from '../middleware/roleMiddleware.js'

const router = express.Router()

// Reviews written about the signed-in doctor.
router.get('/me', protect, authorize('doctor'), getMyReviews)

router.delete('/:id', protect, deleteReview)

export default router
