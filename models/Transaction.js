import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // optional for guest/hybrid flow initial state
    },
    paymentLinkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentLink'
    },
    amount: {
        type: Number,
        required: true
    },
    escrowCharge: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'delivered', 'completed', 'disputed', 'cancelled'],
        default: 'pending'
    },
    paymentReference: {
        type: String,
        required: true,
        unique: true
    },
    deliveryConfirmedBySeller: {
        type: Boolean,
        default: false
    },
    deliveryConfirmedByBuyer: {
        type: Boolean,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    lastNotificationSentAt: {
        type: Date
    },
    notificationLevel: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
