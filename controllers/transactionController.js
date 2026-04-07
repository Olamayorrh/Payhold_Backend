import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import * as EmailService from '../services/emailService.js';
import crypto from 'crypto';

// Reusable logic for processing a successful payment
export const processSuccessfulPayment = async (transaction) => {
    if (transaction.status !== 'pending') return;

    transaction.status = 'paid';
    await transaction.save();

    // 1. Update Seller's Wallet (Escrow Balance)
    let sellerWallet = await Wallet.findOne({ userId: transaction.sellerId });
    if (!sellerWallet) {
        sellerWallet = await Wallet.create({ userId: transaction.sellerId });
    }
    
    // If seller pays the fee, deduct it from their payout now
    const netAmount = transaction.feePaidBy === 'seller' ? transaction.amount - transaction.escrowCharge : transaction.amount;
    sellerWallet.escrowBalance += netAmount;
    await sellerWallet.save();

    // 2. Create Notification for Seller
    const seller = await User.findById(transaction.sellerId);
    await Notification.create({
        userId: transaction.sellerId,
        message: `Payment of ₦${transaction.amount.toLocaleString()} received for item. Funds held in escrow.`,
        type: 'payment'
    });

    // 3. Send Email to Seller
    // Find payment link title for the email
    const populatedTx = await Transaction.findById(transaction._id).populate('paymentLinkId');
    const itemTitle = populatedTx.paymentLinkId?.title || 'Escrow Item';
    
    await EmailService.sendPaymentNotification(seller.email, transaction.amount, itemTitle);
};

// @desc    Handle Paystack Webhooks
// @route   POST /api/payment/webhook
// @access  Public (Validated with Signature)
export const handleWebhook = async (req, res) => {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                  .update(JSON.stringify(req.body))
                  .digest('hex');

    if (hash === req.headers['x-paystack-signature']) {
        const event = req.body;

        if (event.event === 'charge.success') {
            const reference = event.data.reference;
            const transaction = await Transaction.findOne({ paymentReference: reference });

            if (transaction) {
                await processSuccessfulPayment(transaction);
                console.log(`Transaction ${reference} processed via Webhook`);
            }
        }
    }

    res.sendStatus(200);
};

// @desc    Seller marks item as delivered
// @route   POST /api/payment/deliver/:id
// @access  Private (Seller only)
export const markAsDelivered = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id).populate('buyerId paymentLinkId sellerId');

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.sellerId._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (transaction.status !== 'paid') {
            return res.status(400).json({ message: 'Transaction must be PAID before delivery' });
        }

        transaction.status = 'delivered';
        transaction.deliveryConfirmedBySeller = true;
        transaction.deliveredAt = new Date();
        transaction.notificationLevel = 0; // Reset for countdown
        await transaction.save();

        const businessDisplay = transaction.sellerId.businessName || transaction.sellerId.fullName;

        // Notify Buyer
        await Notification.create({
            userId: transaction.buyerId._id,
            message: `"${transaction.paymentLinkId?.title}" has been sent out by "${businessDisplay}", once you receive and inspect, kindly release the payment to "${businessDisplay}".`,
            type: 'delivery'
        });

        // Send Email to Buyer
        await EmailService.sendDeliveryAlert(transaction.buyerId.email, transaction.paymentLinkId?.title || 'your item', businessDisplay);

        res.json({ status: true, message: 'Item marked as SHIPPED. Status updated to In Transit.', data: transaction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Buyer confirms receipt & releases funds
// @route   POST /api/payment/confirm/:id
// @access  Private (Buyer only)
export const confirmReceipt = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.buyerId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (transaction.status !== 'delivered') {
            return res.status(400).json({ message: 'Item must be DELIVERED before confirmation' });
        }

        transaction.status = 'completed';
        transaction.deliveryConfirmedByBuyer = true;
        await transaction.save();

        // Move funds from Escrow to Available Balance
        let sellerWallet = await Wallet.findOne({ userId: transaction.sellerId });
        if (sellerWallet) {
            sellerWallet.escrowBalance -= transaction.amount;
            sellerWallet.availableBalance += transaction.amount;
            await sellerWallet.save();
        }

        // Notify Seller
        await Notification.create({
            userId: transaction.sellerId,
            message: `Buyer confirmed receipt of item. ₦${transaction.amount.toLocaleString()} has been moved to your available balance.`,
            type: 'system'
        });
        
        res.json({ status: true, message: 'Item RECEIVED. Funds released to Seller.', data: transaction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Buyer disputes the item
// @route   POST /api/payment/dispute/:id
// @access  Private (Buyer only)
export const disputeTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.buyerId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (transaction.status !== 'delivered') {
            return res.status(400).json({ message: 'Item must be DELIVERED before raising a dispute' });
        }

        transaction.status = 'disputed';
        await transaction.save();

        // Notify Seller
        await Notification.create({
            userId: transaction.sellerId,
            message: `Buyer has raised a DISPUTE for transaction of ₦${transaction.amount.toLocaleString()}. Funds are now locked.`,
            type: 'dispute'
        });

        res.json({ status: true, message: 'Transaction DISPUTED. Funds are locked in escrow.', data: transaction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
