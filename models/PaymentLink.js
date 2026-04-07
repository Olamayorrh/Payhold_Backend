import mongoose from 'mongoose';

const paymentLinkSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    linkCode: {
        type: String,
        required: true,
        unique: true
    },
    feePaidBy: {
        type: String,
        enum: ['seller', 'buyer'],
        default: 'buyer'
    },
    status: {
        type: String,
        enum: ['active', 'expired'],
        default: 'active'
    }
}, {
    timestamps: true
});

const PaymentLink = mongoose.model('PaymentLink', paymentLinkSchema);

export default PaymentLink;
