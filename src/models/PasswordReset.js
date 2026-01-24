/**
 * Password Reset Model
 * Stores OTP for password reset verification
 */
import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
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
    attempts: {
        type: Number,
        default: 0,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // TTL index - auto delete when expired
    },
    used: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Generate a 6-digit OTP
passwordResetSchema.statics.generateOTP = function () {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create or update OTP for email
passwordResetSchema.statics.createOTP = async function (email) {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this email
    await this.deleteMany({ email: email.toLowerCase() });

    // Create new OTP
    const reset = await this.create({
        email: email.toLowerCase(),
        otp,
        expiresAt,
    });

    return otp;
};

// Verify OTP
passwordResetSchema.statics.verifyOTP = async function (email, otp) {
    const reset = await this.findOne({
        email: email.toLowerCase(),
        used: false,
        expiresAt: { $gt: new Date() },
    });

    if (!reset) {
        return { valid: false, error: 'OTP expired or not found' };
    }

    // Check max attempts (5 attempts max)
    if (reset.attempts >= 5) {
        await this.deleteOne({ _id: reset._id });
        return { valid: false, error: 'Too many attempts. Please request a new OTP.' };
    }

    // Check if OTP matches
    if (reset.otp !== otp) {
        reset.attempts += 1;
        await reset.save();
        return { valid: false, error: 'Invalid OTP' };
    }

    // Mark as used
    reset.used = true;
    await reset.save();

    return { valid: true };
};

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
export default PasswordReset;
