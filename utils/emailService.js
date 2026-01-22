const nodemailer = require('nodemailer');
const db = require('../config/db');

// Helper to create dynamic transporter based on website_id
const getTransporter = async (website_id = 1) => {
    try {
        const [websites] = await db.query('SELECT * FROM websites WHERE id = ?', [website_id]);
        if (websites.length === 0 || !websites[0].smtp_host) {
            console.warn(`No SMTP config found for website ${website_id}, falling back to env.`);
            return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
        }

        const config = websites[0];
        return {
            transporter: nodemailer.createTransport({
                host: config.smtp_host,
                port: config.smtp_port,
                secure: config.smtp_secure === 1,
                auth: { user: config.smtp_user, pass: config.smtp_pass }
            }),
            from: config.from_email || config.contact_email
        };
    } catch (error) {
        console.error("Error creating transporter:", error);
        return null;
    }
};

exports.sendOrderConfirmation = async (email, orderDetails, website_id = 1) => {
    const mailData = await getTransporter(website_id);
    if (!mailData) return;

    const mailOptions = {
        from: mailData.from,
        to: email,
        subject: `Order Confirmation - #${orderDetails.id}`,
        html: `
            <h1>Thank you for your order!</h1>
            <p>Your order #${orderDetails.id} has been placed successfully.</p>
            <p>Total Amount: ₹${orderDetails.total_amount}</p>
            <p>Status: ${orderDetails.status}</p>
        `,
    };

    try {
        await mailData.transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
};

exports.sendOrderStatusUpdate = async (email, orderId, status, website_id = 1) => {
    const mailData = await getTransporter(website_id);
    if (!mailData) return;

    const mailOptions = {
        from: mailData.from,
        to: email,
        subject: `Order Status Update - #${orderId}`,
        html: `
            <h1>Order Status Update</h1>
            <p>Your order #${orderId} status has been updated to: <strong>${status.replace(/_/g, ' ')}</strong></p>
        `,
    };

    try {
        await mailData.transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending status update email:', error);
    }
};

exports.sendPasswordResetEmail = async (email, token, website_id = 1) => {
    const mailData = await getTransporter(website_id);
    if (!mailData) return;

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
    const mailOptions = {
        from: mailData.from,
        to: email,
        subject: `Password Reset Request`,
        html: `
            <h1>Password Reset</h1>
            <p>You requested a password reset. Click the button below to reset it. This link is valid for 1 hour.</p>
            <a href="${resetUrl}" style="background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 20px;">Reset Password</a>
        `,
    };

    try {
        await mailData.transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending reset email:', error);
    }
};
