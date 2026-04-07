import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendPaymentNotification = async (sellerEmail, amount, itemTitle) => {
    try {
        await transporter.sendMail({
            from: `"PayHold Escrow" <${process.env.SMTP_USER}>`,
            to: sellerEmail,
            subject: "Payment Received in Escrow! 💰",
            text: `Good news! A buyer has paid ₦${amount.toLocaleString()} for "${itemTitle}". The funds are now held securely in your escrow balance.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #6366f1;">Payment Received! 💰</h2>
                    <p>A buyer has just paid <b>₦${amount.toLocaleString()}</b> for <b>"${itemTitle}"</b>.</p>
                    <p>The funds are being held securely in your <b>Escrow Balance</b> and will be moved to your Available Balance once the buyer confirms delivery.</p>
                    <p>Please proceed to ship the item and mark it as <b>Delivered</b> on your dashboard.</p>
                    <br />
                    <a href="${process.env.FRONTEND_URL}/escrows" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
                </div>
            `,
        });
        console.log(`Payment notification sent to ${sellerEmail}`);
    } catch (error) {
        console.error("Error sending payment notification email:", error);
    }
};

export const sendDeliveryAlert = async (buyerEmail, itemTitle) => {
    try {
        await transporter.sendMail({
            from: `"PayHold Escrow" <${process.env.SMTP_USER}>`,
            to: buyerEmail,
            subject: "Your Package is on the Way! 🚚",
            text: `The seller has marked "${itemTitle}" as delivered. Please confirm receipt once you have the item.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #6366f1;">Item in Transit! 🚚</h2>
                    <p>The seller has marked <b>"${itemTitle}"</b> as delivered.</p>
                    <p>Once you receive and inspect the item, please log in to your dashboard to <b>Confirm Receipt</b> and release the funds to the seller.</p>
                    <br />
                    <a href="${process.env.FRONTEND_URL}/escrows" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirm Receipt</a>
                </div>
            `,
        });
        console.log(`Delivery alert sent to ${buyerEmail}`);
    } catch (error) {
        console.error("Error sending delivery alert email:", error);
    }
};
