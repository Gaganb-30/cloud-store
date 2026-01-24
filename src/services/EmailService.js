/**
 * Email Service
 * Handles sending emails using nodemailer with SMTP
 */
import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
    }

    /**
     * Initialize the email transporter
     */
    initialize() {
        if (this.initialized) return;

        // Check if email is configured
        if (!config.email?.user || !config.email?.pass) {
            logger.warn('Email service not configured - EMAIL_USER and EMAIL_PASS required');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        this.initialized = true;
        logger.info('Email service initialized');
    }

    /**
     * Send an email
     */
    async sendEmail({ to, subject, text, html }) {
        if (!this.transporter) {
            this.initialize();
        }

        if (!this.transporter) {
            logger.error('Email service not configured');
            throw new Error('Email service not configured');
        }

        const mailOptions = {
            from: `"${config.email.fromName}" <${config.email.user}>`,
            to,
            subject,
            text,
            html,
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            logger.info('Email sent', { to, subject, messageId: result.messageId });
            return result;
        } catch (error) {
            logger.error('Failed to send email', { error: error.message, to, subject });
            throw error;
        }
    }

    /**
     * Send password reset OTP email
     */
    async sendPasswordResetOTP(email, otp) {
        const subject = 'Password Reset OTP - CloudVault';

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #8b5cf6; margin: 0;">☁️ CloudVault</h1>
                </div>
                
                <div style="background: #f3f4f6; border-radius: 12px; padding: 30px; text-align: center;">
                    <h2 style="color: #374151; margin: 0 0 20px 0;">Password Reset Request</h2>
                    <p style="color: #6b7280; margin: 0 0 20px 0;">
                        Use the following OTP to reset your password. This code expires in 10 minutes.
                    </p>
                    <div style="background: #8b5cf6; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 8px; display: inline-block;">
                        ${otp}
                    </div>
                    <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0;">
                        If you didn't request this, please ignore this email.
                    </p>
                </div>
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
                    This is an automated message from CloudVault. Please do not reply.
                </p>
            </div>
        `;

        const text = `
CloudVault - Password Reset

Your password reset OTP is: ${otp}

This code expires in 10 minutes.

If you didn't request this, please ignore this email.
        `;

        return this.sendEmail({ to: email, subject, text, html });
    }

    /**
     * Send signup verification OTP email
     */
    async sendVerificationOTP(email, otp) {
        const subject = 'Verify Your Email - CloudVault';

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #8b5cf6; margin: 0;">☁️ CloudVault</h1>
                </div>
                
                <div style="background: #f3f4f6; border-radius: 12px; padding: 30px; text-align: center;">
                    <h2 style="color: #374151; margin: 0 0 20px 0;">Verify Your Email</h2>
                    <p style="color: #6b7280; margin: 0 0 20px 0;">
                        Welcome to CloudVault! Use the following OTP to complete your registration. This code expires in 15 minutes.
                    </p>
                    <div style="background: #10b981; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 8px; display: inline-block;">
                        ${otp}
                    </div>
                    <p style="color: #9ca3af; font-size: 14px; margin: 20px 0 0 0;">
                        If you didn't create an account, please ignore this email.
                    </p>
                </div>
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
                    This is an automated message from CloudVault. Please do not reply.
                </p>
            </div>
        `;

        const text = `
CloudVault - Verify Your Email

Your verification OTP is: ${otp}

This code expires in 15 minutes.

If you didn't create an account, please ignore this email.
        `;

        return this.sendEmail({ to: email, subject, text, html });
    }
}

const emailService = new EmailService();
export default emailService;
