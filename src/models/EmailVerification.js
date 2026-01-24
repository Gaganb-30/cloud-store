/**
 * Email Verification Model
 * Stores OTP for signup email verification
 */
import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
    },
    // Store pending user data until verified
    pendingUser: {
        username: String,
        password: String, // Already hashed
    },
    attempts: {
        type: Number,
        default: 0,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // TTL index - auto delete when expired
    },
    verified: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Generate a 6-digit OTP
emailVerificationSchema.statics.generateOTP = function () {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create verification for email
emailVerificationSchema.statics.createVerification = async function (email, username, hashedPassword) {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing verification for this email
    await this.deleteMany({ email: email.toLowerCase() });

    // Create new verification
    await this.create({
        email: email.toLowerCase(),
        otp,
        pendingUser: {
            username,
            password: hashedPassword,
        },
        expiresAt,
    });

    return otp;
};

// Verify OTP and return pending user data
emailVerificationSchema.statics.verifyOTP = async function (email, otp) {
    const verification = await this.findOne({
        email: email.toLowerCase(),
        verified: false,
        expiresAt: { $gt: new Date() },
    });

    if (!verification) {
        return { valid: false, error: 'Verification expired or not found. Please register again.' };
    }

    // Check max attempts (5 attempts max)
    if (verification.attempts >= 5) {
        await this.deleteOne({ _id: verification._id });
        return { valid: false, error: 'Too many attempts. Please register again.' };
    }

    // Check if OTP matches
    if (verification.otp !== otp) {
        verification.attempts += 1;
        await verification.save();
        return { valid: false, error: 'Invalid OTP' };
    }

    // Mark as verified
    verification.verified = true;
    await verification.save();

    return {
        valid: true,
        pendingUser: verification.pendingUser,
    };
};

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);
export default EmailVerification;
