/**
 * Register Page
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Mail, Lock, Cloud, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

export default function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
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
            await register(email, username, password);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (error) {
            const message = error.response?.data?.error?.message || 'Registration failed';
            toast.error(message);
            if (message.toLowerCase().includes('email')) {
                setErrors({ email: message });
            } else if (message.toLowerCase().includes('username')) {
                setErrors({ username: message });
            }
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
                        <h1 className="text-2xl font-bold">Create an account</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Start uploading files in seconds
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            icon={Mail}
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={errors.email}
                            autoComplete="email"
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
                            Create Account
                        </Button>
                    </form>

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
