import Transaction from '../models/Transaction.js';
import crypto from 'crypto';

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

            if (transaction && transaction.status === 'pending') {
                transaction.status = 'paid';
                await transaction.save();
                console.log(`Transaction ${reference} marked as PAID via Webhook`);
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
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.sellerId.toString() !== req.user._id.toString()) {
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

        res.json({ status: true, message: 'Item marked as DELIVERED', data: transaction });
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

        // TODO: In Phase 5, trigger real payout to Seller's internal wallet
        
        res.json({ status: true, message: 'Item RECEIVED. Funds released to Seller.', data: transaction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
