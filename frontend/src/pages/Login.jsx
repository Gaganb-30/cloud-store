/**
 * Login Page
 */
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Mail, Lock, Cloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!identifier) {
            setErrors((prev) => ({ ...prev, identifier: 'Email or username is required' }));
            return;
        }
        if (!password) {
            setErrors((prev) => ({ ...prev, password: 'Password is required' }));
            return;
        }

        setLoading(true);
        try {
            await login(identifier, password);
            toast.success('Welcome back!');
            navigate(from, { replace: true });
        } catch (error) {
            const message = error.response?.data?.error?.message || 'Login failed';
            toast.error(message);
            if (message.toLowerCase().includes('credentials')) {
                setErrors({ identifier: ' ', password: message });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Log in - CloudVault</title>
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
                        <h1 className="text-2xl font-bold">Welcome back</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Log in to your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
                        <Input
                            label="Email or Username"
                            type="text"
                            icon={Mail}
                            placeholder="you@example.com or johndoe"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            error={errors.identifier}
                            autoComplete="username"
                        />

                        <Input
                            label="Password"
                            type="password"
                            icon={Lock}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={errors.password}
                            autoComplete="current-password"
                        />

                        <div className="flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-accent hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full"
                        >
                            Log in
                        </Button>
                    </form>

                    <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-accent hover:underline">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </div>
        </>
    );
}
