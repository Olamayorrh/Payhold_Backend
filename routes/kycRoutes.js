import express from 'express';
import { submitKYC, getKYCStatus } from '../controllers/kycController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/submit', protect, submitKYC);
router.get('/status', protect, getKYCStatus);

export default router;
