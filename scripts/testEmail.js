import { sendEscrowNotification } from '../services/emailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from Backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const testEmail = async () => {
    console.log('🚀 Starting Email Test...');
    console.log(`📧 Sending to: ${process.env.EMAIL_USER}`);

    const subject = 'PayHold Email Test - Connection Successful! 🎉';
    const message = 'If you are reading this, your PayHold Gmail App Password is working correctly. Real buyers will now receive notifications!';
    
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #10b981; border-radius: 10px; background-color: #f0fdf4;">
            <h2 style="color: #065f46;">PayHold Email Test Successful! 🎉</h2>
            <p>Hello,</p>
            <p>Your <strong>Gmail App Password</strong> has been configured correctly. Your application can now send real emails to buyers and sellers.</p>
            
            <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #d1fae5;">
                <p style="margin: 0; font-size: 14px; color: #065f46;"><strong>Status:</strong> Connected</p>
                <p style="margin: 0; font-size: 14px; color: #065f46;"><strong>Protocol:</strong> SMTP (Gmail)</p>
            </div>

            <p>You can now proceed to test the full payment link flow.</p>
            <hr style="border: none; border-top: 1px solid #d1fae5; margin: 20px 0;">
            <p style="font-size: 12px; color: #059669;">PayHold Escrow Implementation v1.0</p>
        </div>
    `;

    try {
        const result = await sendEscrowNotification(process.env.EMAIL_USER, subject, message, html);
        if (result) {
            console.log('✅ SUCCESS: Test email sent. Check your inbox!');
        } else {
            console.log('❌ FAILED: Email was not sent. Check your .env credentials.');
        }
    } catch (error) {
        console.error('💥 ERROR during test:', error.message);
    }
};

testEmail();
