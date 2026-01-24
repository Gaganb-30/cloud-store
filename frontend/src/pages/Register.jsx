/**
 * Register Page
 * 2-step email verified signup: Enter details -> Verify OTP
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Cloud, User, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

export default function Register() {
    // Step: 1 = details, 2 = verify OTP
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const { setUser } = useAuth();
    const navigate = useNavigate();

    // Step 1: Submit registration details
    const handleSubmitDetails = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validation
        if (!email) {
            setErrors((prev) => ({ ...prev, email: 'Email is required' }));
            return;
        }
        if (!username) {
            setErrors((prev) => ({ ...prev, username: 'Username is required' }));
            return;
        }
        if (username.length < 3 || username.length > 30) {
            setErrors((prev) => ({ ...prev, username: 'Username must be 3-30 characters' }));
            return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            setErrors((prev) => ({ ...prev, username: 'Only letters, numbers, _ and - allowed' }));
            return;
        }
        if (!password) {
            setErrors((prev) => ({ ...prev, password: 'Password is required' }));
            return;
        }
        if (password.length < 8) {
            setErrors((prev) => ({ ...prev, password: 'Password must be at least 8 characters' }));
            return;
        }
        if (password !== confirmPassword) {
            setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
            return;
        }

        setLoading(true);
        try {
            await authApi.initiateRegister(email, username, password);
            toast.success('Verification code sent to your email!');
            setStep(2);
        } catch (error) {
            const message = error.response?.data?.error?.message || 'Registration failed';
            toast.error(message);
            if (message.toLowerCase().includes('email')) {
                setErrors({ email: message });
            } else if (message.toLowerCase().includes('username')) {
                setErrors({ username: message });
            } else if (message.toLowerCase().includes('disposable')) {
                setErrors({ email: 'Disposable emails not allowed' });
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP and complete registration
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!otp || otp.length !== 6) {
            setErrors({ otp: 'Please enter the 6-digit code' });
            return;
        }

        setLoading(true);
        try {
            const user = await authApi.completeRegister(email, otp);
            setUser(user);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.error?.message || 'Verification failed';
            toast.error(message);
            setErrors({ otp: message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Sign up - CloudVault</title>
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
                        <h1 className="text-2xl font-bold">
                            {step === 1 ? 'Create an account' : 'Verify your email'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {step === 1
                                ? 'Start uploading files in seconds'
                                : `Enter the code sent to ${email}`}
                        </p>
                    </div>

                    {/* Progress dots */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-accent' : 'bg-gray-300'}`} />
                        <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Step 1: Registration Details */}
                        {step === 1 && (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSubmitDetails}
                                className="card p-6 space-y-4"
                            >
                                <Input
                                    label="Email"
                                    type="email"
                                    icon={Mail}
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    error={errors.email}
                                    autoComplete="email"
                                    autoFocus
                                />

                                <Input
                                    label="Username"
                                    type="text"
                                    icon={User}
                                    placeholder="johndoe"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                                    error={errors.username}
                                    autoComplete="username"
                                />

                                <Input
                                    label="Password"
                                    type="password"
                                    icon={Lock}
                                    placeholder="At least 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    error={errors.password}
                                    autoComplete="new-password"
                                />

                                <Input
                                    label="Confirm Password"
                                    type="password"
                                    icon={Lock}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    error={errors.confirmPassword}
                                    autoComplete="new-password"
                                />

                                <Button
                                    type="submit"
                                    loading={loading}
                                    className="w-full"
                                >
                                    Continue
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
                                className="card p-6 space-y-4"
                            >
                                <div className="flex justify-center mb-4">
                                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                                        <Key className="w-8 h-8 text-green-500" />
                                    </div>
                                </div>

                                <Input
                                    label="Verification Code"
                                    type="text"
                                    icon={Key}
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    error={errors.otp}
                                    maxLength={6}
                                    className="text-center text-2xl tracking-widest"
                                    autoFocus
                                />

                                <p className="text-xs text-gray-500 text-center">
                                    Check your email for the 6-digit code. It expires in 15 minutes.
                                </p>

                                <Button
                                    type="submit"
                                    loading={loading}
                                    className="w-full"
                                >
                                    Create Account
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full text-sm text-gray-500 hover:text-accent"
                                >
                                    ← Back to details
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-accent hover:underline">
                            Log in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </>
    );
}
