import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req, res) => {
    const { fullName, email, phone, password, role, nin, businessName } = req.body;
    const businessDocument = req.file ? req.file.path : '';

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            fullName,
            email,
            phone,
            password,
            role: role || 'buyer',
            nin,
            businessName,
            businessDocument
        });

        if (user) {
            // Create user wallet
            await Wallet.create({ userId: user._id });

            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                businessName: user.businessName,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                businessName: user.businessName,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Convert guest to regular user
// @route   POST /api/auth/claim-guest
// @access  Public
export const claimGuest = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Guest account not found' });
        }

        if (!user.isGuest) {
            return res.status(400).json({ message: 'Account is already registered' });
        }

        user.password = password;
        user.isGuest = false;
        await user.save();

        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                businessName: user.businessName,
                role: user.role,
                kycLevel: user.kycLevel,
                isVerified: user.isVerified,
                trustScore: user.trustScore
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check if email exists and user type
// @route   POST /api/auth/check-email
// @access  Public
export const checkEmailStatus = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (user) {
            // Mask the phone: Keep first 5 and last 2 characters
            const phone = user.phone || '';
            const maskedPhone = phone.length > 7 
                ? `${phone.slice(0, 5)}${'*'.repeat(phone.length - 7)}${phone.slice(-2)}`
                : phone;

            return res.json({ 
                status: true, 
                exists: true, 
                isGuest: user.isGuest || false,
                fullName: user.fullName,
                maskedPhone: maskedPhone
            });
        }

        res.json({ status: true, exists: false });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.fullName = req.body.fullName || user.fullName;
            user.email = req.body.email || user.email;
            user.phone = req.body.phone || user.phone;
            user.businessName = req.body.businessName || user.businessName;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                businessName: updatedUser.businessName,
                role: updatedUser.role,
                token: generateToken(updatedUser._id)
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
