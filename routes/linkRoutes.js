import express from 'express';
import { createPaymentLink, getPaymentLinkByCode, getMyLinks } from '../controllers/linkController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createPaymentLink);
router.get('/my-links', protect, getMyLinks);
router.get('/:code', getPaymentLinkByCode);

export default router;
