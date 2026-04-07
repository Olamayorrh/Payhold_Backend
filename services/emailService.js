import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send real email notification
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Email body (text)
 * @param {string} html - Optional HTML version of the message
 */
export const sendEscrowNotification = async (email, subject, message, html = null) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: subject,
            text: message,
            html: html || `<p>${message}</p>`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ Email Error: ${error.message}`);
        // During testing, we don't want to crash the app if email fails
        // but we log it for the developer
    }
};

export const sendAutoReleaseNotification = async (email, transactionRef) => {
    const subject = `Final Notice: Funds Released for Transaction ${transactionRef}`;
    const message = `The 3-day idle period has ended. Since no dispute was raised, funds have been automatically released to the seller for transaction ${transactionRef}.`;
    
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0F172A;">Payment Automatically Released</h2>
            <p>Hello,</p>
            <p>This is a final notice regarding your transaction <strong>${transactionRef}</strong>.</p>
            <p>The 3-day idle period has ended. Since no dispute was raised, the escrowed funds have been automatically released to the seller.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #64748B;">This is an automated message from <strong>PayHold Escrow</strong>. Please do not reply to this email.</p>
        </div>
    `;

    await sendEscrowNotification(email, subject, message, html);
};

export const sendPaymentNotification = async (sellerEmail, amount, itemTitle) => {
    const subject = "Payment Received in Escrow! 💰";
    const message = `Good news! A buyer has paid ₦${amount.toLocaleString()} for "${itemTitle}". The funds are now held securely in your escrow balance.`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1;">Payment Received! 💰</h2>
            <p>A buyer has just paid <b>₦${amount.toLocaleString()}</b> for <b>"${itemTitle}"</b>.</p>
            <p>The funds are being held securely in your <b>Escrow Balance</b> and will be moved to your Available Balance once the buyer confirms delivery.</p>
            <p>Please proceed to ship the item and mark it as <b>Delivered</b> on your dashboard.</p>
            <br />
            <a href="${process.env.FRONTEND_URL}/escrows" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
        </div>
    `;
    await sendEscrowNotification(sellerEmail, subject, message, html);
};

export const sendDeliveryAlert = async (buyerEmail, itemTitle, businessName) => {
    const subject = `Your Package from ${businessName} is on the Way! 🚚`;
    const message = `"${itemTitle}" has been sent out by "${businessName}". Once you receive and inspect the item, please log in to your dashboard to confirm receipt and release the payment to "${businessName}".`;
    
    const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
            <h2 style="color: #3B82F6;">Item in Transit! 🚚</h2>
            <p>Hello,</p>
            <p><strong>"${itemTitle}"</strong> has been sent out by <strong>"${businessName}"</strong>.</p>
            <p>Once you receive and inspect the item, please log in to your dashboard to <strong>Confirm Receipt</strong>. This will release the escrowed payment to <strong>"${businessName}"</strong>.</p>
            
            <div style="margin: 30px 0; text-align: center;">
                <a href="${process.env.FRONTEND_URL}/escrows" style="background: #3B82F6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Confirm Receipt & Release Funds</a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #64748B; text-align: center;">Powered by <strong>${businessName}</strong> via PayHold Escrow.</p>
        </div>
    `;
    await sendEscrowNotification(buyerEmail, subject, message, html);
};
