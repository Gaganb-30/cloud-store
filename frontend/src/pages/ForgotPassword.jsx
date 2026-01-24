/**
 * Forgot Password Page
 * 3-step flow: Enter Email -> Verify OTP -> Reset Password
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Cloud, Key, Lock, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { authApi } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
    const navigate = useNavigate();

    // Step: 1 = enter email, 2 = verify OTP, 3 = new password
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!email) {
            setErrors({ email: 'Email is required' });
            return;
        }

        setLoading(true);
        try {
            await authApi.forgotPassword(email);
            toast.success('OTP sent to your email!');
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!otp || otp.length !== 6) {
            setErrors({ otp: 'Please enter the 6-digit OTP' });
            return;
        }

        setLoading(true);
        try {
            await authApi.verifyOtp(email, otp);
            toast.success('OTP verified!');
            setStep(3);
        } catch (error) {
            const message = error.response?.data?.error?.message || 'Invalid OTP';
            toast.error(message);
            setErrors({ otp: message });
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!newPassword || newPassword.length < 8) {
            setErrors({ newPassword: 'Password must be at least 8 characters' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrors({ confirmPassword: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            await authApi.resetPassword(email, newPassword);
            toast.success('Password reset successful! Please login.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const stepConfig = {
        1: {
            title: 'Forgot Password',
            subtitle: 'Enter your email to receive a reset code',
            icon: Mail,
        },
        2: {
            title: 'Verify OTP',
            subtitle: `Enter the 6-digit code sent to ${email}`,
            icon: Key,
        },
        3: {
            title: 'Reset Password',
            subtitle: 'Enter your new password',
            icon: Lock,
        },
    };

    const currentStep = stepConfig[step];
    const StepIcon = currentStep.icon;

    return (
        <>
            <Helmet>
                <title>Forgot Password - CloudVault</title>
            </Helmet>

            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-flex items-center gap-2 mb-6">
                            <Cloud className="w-10 h-10 text-accent" />
                            <span className="text-2xl font-bold text-gradient">CloudVault</span>
                        </Link>
                        <h1 className="text-2xl font-bold">{currentStep.title}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {currentStep.subtitle}
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`w-3 h-3 rounded-full transition-colors ${s === step
                                        ? 'bg-accent'
                                        : s < step
                                            ? 'bg-green-500'
                                            : 'bg-gray-300 dark:bg-dark-600'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="card p-6">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 rounded-full bg-accent/10">
                                <StepIcon className="w-8 h-8 text-accent" />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {/* Step 1: Enter Email */}
                            {step === 1 && (
                                <motion.form
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleSendOtp}
                                    className="space-y-4"
                                >
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        icon={Mail}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        error={errors.email}
                                        placeholder="you@example.com"
                                        autoFocus
                                    />
                                    <Button type="submit" loading={loading} className="w-full">
                                        Send OTP
                                    </Button>
                                </motion.form>
                            )}

                            {/* Step 2: Verify OTP */}
                            {step === 2 && (
                                <motion.form
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleVerifyOtp}
                                    className="space-y-4"
                                >
                                    <Input
                                        label="Enter OTP"
                                        type="text"
                                        icon={Key}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        error={errors.otp}
                                        placeholder="123456"
                                        maxLength={6}
                                        className="text-center text-2xl tracking-widest"
                                        autoFocus
                                    />
                                    <p className="text-xs text-gray-500 text-center">
                                        Check your email for the 6-digit code. It expires in 10 minutes.
                                    </p>
                                    <Button type="submit" loading={loading} className="w-full">
                                        Verify OTP
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-full text-sm text-gray-500 hover:text-accent"
                                    >
                                        ← Back to email
                                    </button>
                                </motion.form>
                            )}

                            {/* Step 3: New Password */}
                            {step === 3 && (
                                <motion.form
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleResetPassword}
                                    className="space-y-4"
                                >
                                    <Input
                                        label="New Password"
                                        type="password"
                                        icon={Lock}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        error={errors.newPassword}
                                        placeholder="••••••••"
                                        autoFocus
                                    />
                                    <Input
                                        label="Confirm Password"
                                        type="password"
                                        icon={Lock}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        error={errors.confirmPassword}
                                        placeholder="••••••••"
                                    />
                                    <Button type="submit" loading={loading} className="w-full">
                                        Reset Password
                                    </Button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
                        Remember your password?{' '}
                        <Link to="/login" className="text-accent hover:underline">
                            Log in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </>
    );
}
