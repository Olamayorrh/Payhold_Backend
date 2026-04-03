import express from 'express';
import { registerUser, authUser, getUserProfile, claimGuest } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/signup', upload.single('businessDocument'), registerUser);
router.post('/login', authUser);
router.post('/claim-guest', claimGuest);
router.get('/profile', protect, getUserProfile);

export default router;
