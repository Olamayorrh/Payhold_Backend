import express from 'express';
import { handleWebhook, markAsDelivered, confirmReceipt } from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Webhook is public (verified via signature)
router.post('/webhook', handleWebhook);

// Protected transaction actions
router.post('/deliver/:id', protect, markAsDelivered);
router.post('/confirm/:id', protect, confirmReceipt);

export default router;
