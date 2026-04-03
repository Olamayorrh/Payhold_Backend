import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import paymentRoutes from './routes/paymentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import linkRoutes from './routes/linkRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import kycRoutes from './routes/kycRoutes.js';
import { initCronJobs } from './services/cronService.js';

dotenv.config();

// Initialize Cron Jobs
initCronJobs();

// Connect to Database
connectDB();

const app = express();

// Serve static files
app.use('/uploads', express.static('uploads'));

// Middleware
const corsOptions = {
    origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/payment', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/link', linkRoutes);

app.get('/', (req, res) => {
    res.send('PayHold Backend is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(`💥 ERROR: ${err.message}`);
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
