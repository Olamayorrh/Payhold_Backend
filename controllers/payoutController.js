import Payout from '../models/Payout.js';
import Wallet from '../models/Wallet.js';
import crypto from 'crypto';

// @desc    Request a payout
// @route   POST /api/payout/request
// @access  Private
export const requestPayout = async (req, res) => {
    try {
        const { amount, bankName, accountNumber, accountName } = req.body;

        if (!amount || !bankName || !accountNumber || !accountName) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const wallet = await Wallet.findOne({ userId: req.user._id });

        if (!wallet || wallet.availableBalance < amount) {
            return res.status(400).json({ message: 'Insufficient cleared funds' });
        }

        // Deduct from wallet immediately to "lock" the funds
        wallet.availableBalance -= amount;
        await wallet.save();

        const payout = await Payout.create({
            userId: req.user._id,
            amount,
            bankName,
            accountNumber,
            accountName,
            reference: `PO-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
            status: 'pending'
        });

        res.status(201).json({
            status: true,
            message: 'Payout request submitted successfully',
            data: payout
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get payout history
// @route   GET /api/payout/history
// @access  Private
export const getMyPayouts = async (req, res) => {
    try {
        const payouts = await Payout.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ status: true, data: payouts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
