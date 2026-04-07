import express from 'express';
import { requestPayout, getMyPayouts } from '../controllers/payoutController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/request', protect, requestPayout);
router.get('/history', protect, getMyPayouts);

export default router;
