/**
 * Authentication Service
 * Handles JWT token generation, validation, and refresh
 */

import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { User } from '../models/index.js';
import { sessionClient } from '../config/redis.js';
import { generateToken } from '../utils/hash.js';
import {
    AuthenticationError,
    ValidationError,
    ConflictError,
} from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Token types
 */
const TokenType = {
    ACCESS: 'access',
    REFRESH: 'refresh',
};

/**
 * Parse duration string to milliseconds
 */
function parseDuration(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 60 * 60 * 1000; // Default 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
}

class AuthService {
    /**
     * Step 1: Initiate registration - validate and send OTP
     */
    async initiateRegistration(email, username, password) {
        const { isDisposableEmail } = await import('../utils/emailBlocklist.js');
        const { EmailVerification } = await import('../models/index.js');
        const emailService = (await import('./EmailService.js')).default;

        // Validate input
        if (!email || !username || !password) {
            throw new ValidationError('Email, username, and password are required');
        }

        if (password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters');
        }

        if (username.length < 3 || username.length > 30) {
            throw new ValidationError('Username must be 3-30 characters');
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new ValidationError('Username can only contain letters, numbers, underscores, and hyphens');
        }

        // Block disposable/temp emails
        if (isDisposableEmail(email)) {
            throw new ValidationError('Disposable email addresses are not allowed. Please use a permanent email.');
        }

        // Check for existing email
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            throw new ConflictError('Email already registered');
        }

        // Check for existing username
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            throw new ConflictError('Username already taken');
        }

        // Hash password for storage in pending verification
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash(password, 12);

        // Create verification and send OTP
        const otp = await EmailVerification.createVerification(email, username, hashedPassword);

        try {
            await emailService.sendVerificationOTP(email, otp);
            logger.info('Verification OTP sent', { email, username });
        } catch (error) {
            logger.error('Failed to send verification email', { email, error: error.message });
            throw new Error('Failed to send verification email. Please try again.');
        }

        return {
            message: 'Verification code sent to your email.',
            email,
        };
    }

    /**
     * Step 2: Complete registration - verify OTP and create user
     */
    async completeRegistration(email, otp) {
        const { EmailVerification } = await import('../models/index.js');

        const result = await EmailVerification.verifyOTP(email, otp);

        if (!result.valid) {
            throw new ValidationError(result.error);
        }

        // Double-check email/username still available (race condition protection)
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            throw new ConflictError('Email already registered');
        }

        const existingUsername = await User.findByUsername(result.pendingUser.username);
        if (existingUsername) {
            throw new ConflictError('Username already taken');
        }

        // Create user with pre-hashed password
        const user = new User({
            email,
            username: result.pendingUser.username,
            emailVerified: true,
        });
        user.password = result.pendingUser.password; // Already hashed
        await user.save({ validateBeforeSave: false }); // Skip password hashing

        // Clean up verification record
        await EmailVerification.deleteMany({ email: email.toLowerCase() });

        logger.info('User registered via email verification', { userId: user._id, email: user.email, username: user.username });

        // Generate tokens
        const tokens = await this.generateTokens(user);

        return {
            user: user.toJSON(),
            ...tokens,
        };
    }

    /**
     * Legacy: Direct registration (for backwards compatibility, but blocks temp emails)
     */
    async register(email, username, password) {
        const { isDisposableEmail } = await import('../utils/emailBlocklist.js');

        // Validate input
        if (!email || !username || !password) {
            throw new ValidationError('Email, username, and password are required');
        }

        if (password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters');
        }

        if (username.length < 3 || username.length > 30) {
            throw new ValidationError('Username must be 3-30 characters');
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new ValidationError('Username can only contain letters, numbers, underscores, and hyphens');
        }

        // Block disposable/temp emails
        if (isDisposableEmail(email)) {
            throw new ValidationError('Disposable email addresses are not allowed. Please use a permanent email.');
        }

        // Check for existing email
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            throw new ConflictError('Email already registered');
        }

        // Check for existing username
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            throw new ConflictError('Username already taken');
        }

        // Create user
        const user = new User({ email, username, password });
        await user.save();

        logger.info('User registered', { userId: user._id, email: user.email, username: user.username });

        // Generate tokens
        const tokens = await this.generateTokens(user);

        return {
            user: user.toJSON(),
            ...tokens,
        };
    }

    /**
     * Login user (via email or username)
     */
    async login(identifier, password) {
        // Validate input
        if (!identifier || !password) {
            throw new ValidationError('Email/username and password are required');
        }

        // Find user by email or username
        const user = await User.findByEmailOrUsername(identifier);
        if (!user) {
            throw new AuthenticationError('Invalid credentials');
        }

        // Check lockout
        if (user.isLockedOut()) {
            throw new AuthenticationError('Account is temporarily locked. Try again later.');
        }

        // Verify password
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            await user.incrementFailedLogins();
            throw new AuthenticationError('Invalid credentials');
        }

        // Reset failed attempts and update last login
        await user.resetFailedLogins();
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const tokens = await this.generateTokens(user);

        logger.info('User logged in', { userId: user._id, email: user.email, username: user.username });

        return {
            user: user.toJSON(),
            ...tokens,
        };
    }

    /**
     * Logout user (invalidate refresh token)
     */
    async logout(userId, refreshToken) {
        const user = await User.findById(userId);
        if (user && refreshToken) {
            await user.removeRefreshToken(refreshToken);

            // Blacklist the access token
            // (In production, you might want to blacklist the access token in Redis)
        }

        logger.info('User logged out', { userId });
    }

    /**
     * Logout from all devices
     */
    async logoutAll(userId) {
        const user = await User.findById(userId);
        if (user) {
            await user.removeAllRefreshTokens();
        }

        logger.info('User logged out from all devices', { userId });
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw new AuthenticationError('Refresh token required');
        }

        try {
            // Verify refresh token
            const payload = jwt.verify(refreshToken, config.jwt.refreshSecret);

            if (payload.type !== TokenType.REFRESH) {
                throw new AuthenticationError('Invalid token type');
            }

            // Find user and validate refresh token
            const user = await User.findById(payload.sub);
            if (!user || !user.isActive) {
                throw new AuthenticationError('User not found or inactive');
            }

            // Check if refresh token exists in user's tokens
            if (!user.validateRefreshToken(refreshToken)) {
                throw new AuthenticationError('Refresh token revoked or expired');
            }

            // Generate new tokens (token rotation)
            await user.removeRefreshToken(refreshToken);
            const tokens = await this.generateTokens(user);

            logger.debug('Token refreshed', { userId: user._id });

            return {
                user: user.toJSON(),
                ...tokens,
            };
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthenticationError('Refresh token expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthenticationError('Invalid refresh token');
            }
            throw error;
        }
    }

    /**
     * Verify access token
     */
    async verifyAccessToken(token) {
        if (!token) {
            throw new AuthenticationError('Access token required');
        }

        try {
            const payload = jwt.verify(token, config.jwt.accessSecret);

            if (payload.type !== TokenType.ACCESS) {
                throw new AuthenticationError('Invalid token type');
            }

            // Check if token is blacklisted
            const isBlacklisted = await this.isTokenBlacklisted(token);
            if (isBlacklisted) {
                throw new AuthenticationError('Token has been revoked');
            }

            return payload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthenticationError('Access token expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthenticationError('Invalid access token');
            }
            throw error;
        }
    }

    /**
     * Get user from token
     */
    async getUserFromToken(token) {
        const payload = await this.verifyAccessToken(token);

        const user = await User.findById(payload.sub);
        if (!user || !user.isActive) {
            throw new AuthenticationError('User not found or inactive');
        }

        return user;
    }

    /**
     * Generate access and refresh tokens
     */
    async generateTokens(user) {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        // Calculate refresh token expiry
        const refreshExpiresIn = parseDuration(config.jwt.refreshExpiresIn);
        const expiresAt = new Date(Date.now() + refreshExpiresIn);

        // Store refresh token
        await user.addRefreshToken(refreshToken, expiresAt);

        return {
            accessToken,
            refreshToken,
            expiresIn: parseDuration(config.jwt.accessExpiresIn) / 1000, // In seconds
        };
    }

    /**
     * Generate access token
     */
    generateAccessToken(user) {
        return jwt.sign(
            {
                sub: user._id.toString(),
                email: user.email,
                role: user.role,
                type: TokenType.ACCESS,
            },
            config.jwt.accessSecret,
            { expiresIn: config.jwt.accessExpiresIn }
        );
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(user) {
        const tokenId = generateToken(16);

        return jwt.sign(
            {
                sub: user._id.toString(),
                jti: tokenId,
                type: TokenType.REFRESH,
            },
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpiresIn }
        );
    }

    /**
     * Blacklist an access token
     */
    async blacklistToken(token) {
        try {
            const payload = jwt.decode(token);
            if (!payload || !payload.exp) return;

            const ttl = payload.exp - Math.floor(Date.now() / 1000);
            if (ttl > 0) {
                await sessionClient.setex(`blacklist:${token}`, ttl, '1');
            }
        } catch (error) {
            logger.error('Failed to blacklist token', { error: error.message });
        }
    }

    /**
     * Check if token is blacklisted
     */
    async isTokenBlacklisted(token) {
        try {
            const result = await sessionClient.get(`blacklist:${token}`);
            return result === '1';
        } catch (error) {
            logger.error('Failed to check token blacklist', { error: error.message });
            return false;
        }
    }

    /**
     * Change password
     */
    async changePassword(userId, currentPassword, newPassword) {
        if (!newPassword || newPassword.length < 8) {
            throw new ValidationError('New password must be at least 8 characters');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new AuthenticationError('User not found');
        }

        const isValid = await user.comparePassword(currentPassword);
        if (!isValid) {
            throw new AuthenticationError('Current password is incorrect');
        }

        user.password = newPassword;
        await user.save();

        // Invalidate all refresh tokens
        await user.removeAllRefreshTokens();

        logger.info('Password changed', { userId });

        return { message: 'Password changed successfully' };
    }

    /**
     * Change username (requires password verification)
     */
    async changeUsername(userId, newUsername, password) {
        if (!newUsername || newUsername.length < 3 || newUsername.length > 30) {
            throw new ValidationError('Username must be 3-30 characters');
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
            throw new ValidationError('Username can only contain letters, numbers, underscores, and hyphens');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new AuthenticationError('User not found');
        }

        // Verify password
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            throw new AuthenticationError('Password is incorrect');
        }

        // Check if new username is already taken
        const existingUser = await User.findByUsername(newUsername);
        if (existingUser && existingUser._id.toString() !== userId.toString()) {
            throw new ConflictError('Username already taken');
        }

        const oldUsername = user.username;
        user.username = newUsername.toLowerCase();
        await user.save();

        logger.info('Username changed', { userId, oldUsername, newUsername: user.username });

        return { message: 'Username changed successfully', username: user.username };
    }

    /**
     * Change email (requires password verification)
     */
    async changeEmail(userId, newEmail, password) {
        if (!newEmail || !newEmail.includes('@')) {
            throw new ValidationError('Please enter a valid email address');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new AuthenticationError('User not found');
        }

        // Verify password
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            throw new AuthenticationError('Password is incorrect');
        }

        // Check if new email is already taken
        const existingUser = await User.findByEmail(newEmail);
        if (existingUser && existingUser._id.toString() !== userId.toString()) {
            throw new ConflictError('Email already in use');
        }

        const oldEmail = user.email;
        user.email = newEmail.toLowerCase();
        await user.save();

        logger.info('Email changed', { userId, oldEmail, newEmail: user.email });

        return { message: 'Email changed successfully', email: user.email };
    }

    /**
     * Request password reset - sends OTP to email
     */
    async forgotPassword(email) {
        const { PasswordReset } = await import('../models/index.js');
        const emailService = (await import('./EmailService.js')).default;

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to prevent email enumeration
        if (!user) {
            logger.info('Password reset requested for non-existent email', { email });
            return { message: 'If an account exists with this email, you will receive an OTP shortly.' };
        }

        // Generate and save OTP
        const otp = await PasswordReset.createOTP(email);

        // Send OTP email
        try {
            await emailService.sendPasswordResetOTP(email, otp);
            logger.info('Password reset OTP sent', { email });
        } catch (error) {
            logger.error('Failed to send password reset email', { email, error: error.message });
            throw new Error('Failed to send reset email. Please try again later.');
        }

        return { message: 'If an account exists with this email, you will receive an OTP shortly.' };
    }

    /**
     * Verify OTP for password reset
     */
    async verifyResetOTP(email, otp) {
        const { PasswordReset } = await import('../models/index.js');

        const result = await PasswordReset.verifyOTP(email, otp);

        if (!result.valid) {
            throw new ValidationError(result.error);
        }

        logger.info('Password reset OTP verified', { email });
        return { valid: true, message: 'OTP verified. You can now reset your password.' };
    }

    /**
     * Reset password with verified OTP
     */
    async resetPassword(email, newPassword) {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            throw new ValidationError('Invalid request');
        }

        // Validate new password
        if (!newPassword || newPassword.length < 8) {
            throw new ValidationError('Password must be at least 8 characters');
        }

        // Update password
        user.password = newPassword;
        user.refreshTokens = []; // Logout from all devices
        await user.save();

        logger.info('Password reset successful', { userId: user._id, email });

        return { message: 'Password reset successful. Please login with your new password.' };
    }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
