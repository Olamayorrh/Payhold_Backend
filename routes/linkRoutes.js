import express from 'express';
import { createPaymentLink, getPaymentLinkByCode, getMyLinks } from '../controllers/linkController.js';
import { protect, seller } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, seller, createPaymentLink);
router.get('/my-links', protect, seller, getMyLinks);
router.get('/:code', getPaymentLinkByCode);

export default router;
