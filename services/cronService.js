import cron from 'node-cron';
import Transaction from '../models/Transaction.js';
import { sendEscrowNotification } from './emailService.js';

// Configuration for testing (3 minutes instead of 3 days)
const TEST_MODE = false;
const MS_PER_DAY = TEST_MODE ? 60000 : 86400000;

export const initCronJobs = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        console.log('⏰ Running daily escrow check...');

        try {
            const deliveredTransactions = await Transaction.find({ status: 'delivered' }).populate('buyerId sellerId');

            for (const tx of deliveredTransactions) {
                const timeDiff = Date.now() - new Date(tx.deliveredAt).getTime();
                const daysPassed = Math.floor(timeDiff / MS_PER_DAY);

                if (daysPassed >= 3 && tx.notificationLevel < 3) {
                    // Final Release
                    tx.status = 'completed';
                    tx.deliveryConfirmedByBuyer = true;
                    tx.notificationLevel = 3;
                    await tx.save();

                    await sendEscrowNotification(
                        tx.buyerId.email,
                        'Final Notice: Transaction Completed',
                        `You did not respond within the 3-day window. Funds for transaction ${tx.paymentReference} have been automatically released to the seller.`
                    );
                    console.log(`✅ Auto-released transaction ${tx.paymentReference}`);
                } 
                else if (daysPassed === 2 && tx.notificationLevel < 2) {
                    // Day 2 Reminder
                    tx.notificationLevel = 2;
                    await tx.save();

                    await sendEscrowNotification(
                        tx.buyerId.email,
                        'Reminder (2/3): Confirm Delivery',
                        `This is your second reminder. If you do not confirm receipt by tomorrow, funds for transaction ${tx.paymentReference} will be released automatically.`
                    );
                }
                else if (daysPassed === 1 && tx.notificationLevel < 1) {
                    // Day 1 Reminder
                    tx.notificationLevel = 1;
                    await tx.save();

                    await sendEscrowNotification(
                        tx.buyerId.email,
                        'Reminder: Please Confirm Delivery',
                        `Your item was marked as delivered yesterday. Please log in to confirm receipt and release funds to the seller.`
                    );
                }
            }
        } catch (error) {
            console.error('Cron Error:', error);
        }
    });
};
