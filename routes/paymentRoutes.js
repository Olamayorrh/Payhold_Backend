import express from 'express';
import { initializeTransaction, verifyTransaction, getUserTransactions } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/initialize', initializeTransaction);
router.get('/verify/:reference', verifyTransaction);
router.get('/transactions', protect, getUserTransactions);

export default router;
