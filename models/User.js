import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['buyer', 'seller'],
        default: 'buyer'
    },
    businessName: {
        type: String,
        required: false
    },
    kycLevel: {
        type: Number,
        enum: [0, 1, 2, 3],
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    trustScore: {
        type: Number,
        default: 100
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    nin: {
        type: String,
        required: false
    },
    businessDocument: {
        type: String, // Can store document URL or ID
        required: false
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
