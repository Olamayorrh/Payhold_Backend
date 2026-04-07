import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    bankName: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    accountName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    reference: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: true
});

const Payout = mongoose.model('Payout', payoutSchema);

export default Payout;
