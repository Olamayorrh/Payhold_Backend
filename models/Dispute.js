import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    evidenceUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ['open', 'resolved', 'cancelled'],
        default: 'open'
    }
}, {
    timestamps: true
});

const Dispute = mongoose.model('Dispute', disputeSchema);

export default Dispute;
