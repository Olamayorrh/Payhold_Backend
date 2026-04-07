import express from 'express';
import { registerUser, authUser, getUserProfile, claimGuest, checkEmailStatus, updateUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/signup', upload.single('businessDocument'), registerUser);
router.post('/login', authUser);
router.post('/claim-guest', claimGuest);
router.post('/check-email', checkEmailStatus);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

export default router;
