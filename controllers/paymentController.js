import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import PaymentLink from '../models/PaymentLink.js';
import Wallet from '../models/Wallet.js';
import * as paystackService from '../services/paystackService.js';
import { sendEscrowNotification } from '../services/emailService.js';
import { processSuccessfulPayment } from './transactionController.js';
import crypto from 'crypto';

// @desc    Initialize a transaction via a payment link (Hybrid Guest Flow)
// @route   POST /api/payment/initialize
// @access  Public
export const initializeTransaction = async (req, res) => {
    try {
        const { linkCode, buyerEmail, buyerPhone, buyerFullName } = req.body;

        if (!linkCode || !buyerEmail || !buyerPhone) {
            return res.status(400).json({ status: false, message: 'All fields are required' });
        }

        // 1. Find Payment Link
        const paymentLink = await PaymentLink.findOne({ linkCode }).populate('sellerId');
        if (!paymentLink) {
            return res.status(404).json({ status: false, message: 'Invalid payment link' });
        }

        // 2. Handle Buyer (Guest or Registered)
        let buyer = await User.findOne({ email: buyerEmail });
        if (!buyer) {
            // Create a guest user shell
            buyer = await User.create({
                fullName: buyerFullName || 'Guest Buyer',
                email: buyerEmail,
                phone: buyerPhone,
                password: req.body.password || crypto.randomBytes(8).toString('hex'), // Use supplied password or random
                isGuest: true,
                role: 'buyer'
            });
            // Create wallet for guest
            await Wallet.create({ userId: buyer._id });
        }

        const sellerPrice = paymentLink.amount;
        const platformFee = sellerPrice * 0.025; // 2.5% platform fee
        
        // Total amount depends on who pays the fee
        const totalAmount = paymentLink.feePaidBy === 'buyer' ? sellerPrice + platformFee : sellerPrice;
        
        const reference = crypto.randomBytes(12).toString('hex');

        // 3. Initialize Paystack
        const paystackResponse = await paystackService.initializePayment(
            buyerEmail,
            totalAmount,
            reference,
            `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pay/verify?reference=${reference}`
        );

        if (paystackResponse.status) {
            // 4. Create Transaction Record
            const newTransaction = new Transaction({
                sellerId: paymentLink.sellerId._id,
                buyerId: buyer._id,
                paymentLinkId: paymentLink._id,
                amount: sellerPrice,
                escrowCharge: platformFee,
                totalAmount,
                feePaidBy: paymentLink.feePaidBy,
                paymentReference: reference,
                status: 'pending'
            });

            await newTransaction.save();

            // 5. Send Notification to Buyer
            const businessDisplay = paymentLink.sellerId.businessName || paymentLink.sellerId.fullName;
            const emailSubject = `Complete your Payment for ${paymentLink.title}`;
            const emailMessage = `You have initiated a secure escrow payment for "${paymentLink.title}" with ${businessDisplay}. Please complete your payment of ₦${totalAmount.toLocaleString()} to proceed.`;
                                 
            const html = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #0F172A;">Payment Initiated</h2>
                    <p>Hello ${buyerFullName},</p>
                    <p>You have initiated a secure escrow payment for <strong>"${paymentLink.title}"</strong> with <strong>${businessDisplay}</strong>.</p>
                    
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; color: #64748B;">Amount to Pay:</p>
                        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #3B82F6;">₦${totalAmount.toLocaleString()}</p>
                    </div>

                    <p>Please complete your payment via the link provided in the application to proceed with the transaction. Your funds will be held securely in escrow until you confirm delivery of the item/service.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #64748B;">Powered by <strong>${businessDisplay}</strong> via PayHold Escrow.</p>
                </div>
            `;

            await sendEscrowNotification(buyerEmail, emailSubject, emailMessage, html);

            return res.status(200).json({
                status: true,
                message: 'Transaction initialized',
                data: {
                    authorization_url: paystackResponse.data.authorization_url,
                    reference: reference,
                    totalAmount: totalAmount,
                    platformFee: platformFee
                }
            });
        }

        res.status(400).json({ status: false, message: 'Failed to initialize Paystack payment' });

    } catch (error) {
        console.error('Initialize error:', error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// @desc    Verify payment reference
// @route   GET /api/payment/verify/:reference
// @access  Public
export const verifyTransaction = async (req, res) => {
    try {
        const { reference } = req.params;
        const verificationData = await paystackService.verifyPayment(reference);

        const transaction = await Transaction.findOne({ paymentReference: reference }).populate('buyerId sellerId');

        if (!transaction) {
            return res.status(404).json({ status: false, message: 'Transaction not found' });
        }

        if (verificationData.status && verificationData.data.status === 'success') {
            await processSuccessfulPayment(transaction);

            return res.status(200).json({
                status: true,
                message: 'Payment verified successfully',
                data: transaction
            });
        }

        res.status(400).json({ status: false, message: 'Payment verification failed' });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ status: false, message: error.message });
    }
};

// @desc    Get transactions for logic user
// @route   GET /api/payment/transactions
// @access  Private
export const getUserTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            $or: [{ sellerId: req.user._id }, { buyerId: req.user._id }]
        }).populate('sellerId buyerId paymentLinkId').sort({ createdAt: -1 });

        res.json({
            status: true,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// @desc    Get user wallet balance
// @route   GET /api/payment/wallet
// @access  Private
export const getMyWallet = async (req, res) => {
    try {
        let wallet = await Wallet.findOne({ userId: req.user._id });
        if (!wallet) {
            wallet = await Wallet.create({ userId: req.user._id });
        }
        res.json({ status: true, data: wallet });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
