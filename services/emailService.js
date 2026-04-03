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
