import PaymentLink from '../models/PaymentLink.js';
import crypto from 'crypto';

// @desc    Create a new payment link
// @route   POST /api/link/create
// @access  Private (Seller only)
export const createPaymentLink = async (req, res) => {
    const { title, description, amount } = req.body;

    try {
        const linkCode = crypto.randomBytes(4).toString('hex');

        const paymentLink = await PaymentLink.create({
            sellerId: req.user._id,
            title,
            description,
            amount,
            linkCode
        });

        res.status(201).json({
            status: true,
            message: 'Payment link created successfully',
            data: paymentLink
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get payment link by code
// @route   GET /api/link/:code
// @access  Public
export const getPaymentLinkByCode = async (req, res) => {
    const { code } = req.params;

    try {
        const paymentLink = await PaymentLink.findOne({ linkCode: code }).populate('sellerId', 'fullName trustScore isVerified');

        if (!paymentLink) {
            return res.status(404).json({ message: 'Payment link not found' });
        }

        res.json({
            status: true,
            data: paymentLink
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all links by seller
// @route   GET /api/link/my-links
// @access  Private
export const getMyLinks = async (req, res) => {
    try {
        const links = await PaymentLink.find({ sellerId: req.user._id });
        res.json({
            status: true,
            data: links
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
