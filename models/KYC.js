import mongoose from 'mongoose';

const kycSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nin: {
        type: String,
        required: true
    },
    bvn: {
        type: String,
        required: true
    },
    businessName: {
        type: String
    },
    cacNumber: {
        type: String
    },
    documentUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const KYC = mongoose.model('KYC', kycSchema);

export default KYC;
