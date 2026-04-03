import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const paystack = axios.create({
    baseURL: 'https://api.paystack.co',
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
    },
});

export const initializePayment = async (email, amount, reference, callbackUrl) => {
    try {
        const response = await paystack.post('/transaction/initialize', {
            email,
            amount: amount * 100, // Paystack works with Kobo
            reference,
            callback_url: callbackUrl,
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error initializing Paystack transaction');
    }
};

export const verifyPayment = async (reference) => {
    try {
        const response = await paystack.get(`/transaction/verify/${reference}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error verifying Paystack transaction');
    }
};
