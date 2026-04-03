import KYC from '../models/KYC.js';
import User from '../models/User.js';

// @desc    Submit KYC verification
// @route   POST /api/kyc/submit
// @access  Private
export const submitKYC = async (req, res) => {
    const { nin, bvn, businessName, cacNumber } = req.body;

    try {
        const kyc = await KYC.create({
            userId: req.user._id,
            nin,
            bvn,
            businessName,
            cacNumber,
            status: 'pending'
        });

        // For MVP mock logic: Approve Level 1 immediately if NIN is 11 digits
        if (nin.length === 11) {
            kyc.status = 'approved';
            await kyc.save();

            const user = await User.findById(req.user._id);
            user.kycLevel = 1;
            user.isVerified = true;
            await user.save();
        }

        res.status(201).json({
            status: true,
            message: 'KYC submitted and processing',
            data: kyc
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// @desc    Get KYC status
// @route   GET /api/kyc/status
// @access  Private
export const getKYCStatus = async (req, res) => {
    try {
        const kyc = await KYC.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({
            status: true,
            data: kyc
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
