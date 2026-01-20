/**
 * Settings Page
 */
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { User, Lock, Moon, Sun, HardDrive, Crown, AtSign, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../api/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { formatBytes } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Settings() {
    const { user, quota, isPremium, refreshUser } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Username change state
    const [newUsername, setNewUsername] = useState('');
    const [usernamePassword, setUsernamePassword] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);

    // Email change state
    const [newEmail, setNewEmail] = useState('');
    const [emailPassword, setEmailPassword] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);

    // Refresh quota when settings page loads
    useEffect(() => {
        refreshUser();
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (!currentPassword || !newPassword) {
            toast.error('Please fill in all fields');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await authApi.changePassword(currentPassword, newPassword);
            toast.success('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleChangeUsername = async (e) => {
        e.preventDefault();

        if (!newUsername) {
            toast.error('Please enter a new username');
            return;
        }
        if (newUsername.length < 3 || newUsername.length > 30) {
            toast.error('Username must be 3-30 characters');
            return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
            toast.error('Username can only contain letters, numbers, underscores, and hyphens');
            return;
        }
        if (!usernamePassword) {
            toast.error('Please enter your password to confirm');
            return;
        }

        setUsernameLoading(true);
        try {
            const result = await authApi.changeUsername(newUsername, usernamePassword);
            toast.success('Username changed successfully');
            setNewUsername('');
            setUsernamePassword('');
            refreshUser(); // Refresh user data to show new username
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to change username');
        } finally {
            setUsernameLoading(false);
        }
    };

    const handleChangeEmail = async (e) => {
        e.preventDefault();

        if (!newEmail) {
            toast.error('Please enter a new email');
            return;
        }
        if (!newEmail.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (!emailPassword) {
            toast.error('Please enter your password to confirm');
            return;
        }

        setEmailLoading(true);
        try {
            const result = await authApi.changeEmail(newEmail, emailPassword);
            toast.success('Email changed successfully');
            setNewEmail('');
            setEmailPassword('');
            refreshUser(); // Refresh user data to show new email
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to change email');
        } finally {
            setEmailLoading(false);
        }
    };

    // Get storage data from quota
    const storageUsed = quota?.storage?.used || 0;
    const storageLimit = quota?.storage?.limit || (isPremium ? -1 : 50 * 1024 * 1024 * 1024);
    const storagePercentage = quota?.storage?.percentage || 0;

    return (
        <>
            <Helmet>
                <title>Settings - CloudVault</title>
            </Helmet>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-2xl font-bold mb-8">Settings</h1>

                    <div className="space-y-6">
                        {/* Account Info */}
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <User className="w-5 h-5 text-accent" />
                                <h2 className="text-lg font-semibold">Account</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="font-medium">Username</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">@{user?.username}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="font-medium">Email</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="font-medium">Account Type</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {isPremium ? 'Premium' : 'Free'}
                                        </p>
                                    </div>
                                    {!isPremium && (
                                        <Button size="sm" icon={Crown}>
                                            Upgrade
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Storage */}
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <HardDrive className="w-5 h-5 text-accent" />
                                <h2 className="text-lg font-semibold">Storage</h2>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span>Used</span>
                                    <span>{formatBytes(storageUsed)} / {formatBytes(storageLimit)}</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent rounded-full transition-all"
                                        style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Theme */}
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                {theme === 'dark' ? <Moon className="w-5 h-5 text-accent" /> : <Sun className="w-5 h-5 text-accent" />}
                                <h2 className="text-lg font-semibold">Appearance</h2>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Theme</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className="relative w-14 h-8 bg-gray-200 dark:bg-dark-600 rounded-full transition-colors"
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white dark:bg-accent rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        </div>

                        {/* Change Username */}
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <AtSign className="w-5 h-5 text-accent" />
                                <h2 className="text-lg font-semibold">Change Username</h2>
                            </div>

                            <form onSubmit={handleChangeUsername} className="space-y-4">
                                <Input
                                    label="New Username"
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                                    placeholder="newusername"
                                />
                                <Input
                                    label="Current Password"
                                    type="password"
                                    value={usernamePassword}
                                    onChange={(e) => setUsernamePassword(e.target.value)}
                                    placeholder="Enter your password to confirm"
                                />
                                <Button type="submit" loading={usernameLoading}>
                                    Change Username
                                </Button>
                            </form>
                        </div>

                        {/* Change Email */}
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Mail className="w-5 h-5 text-accent" />
                                <h2 className="text-lg font-semibold">Change Email</h2>
                            </div>

                            <form onSubmit={handleChangeEmail} className="space-y-4">
                                <Input
                                    label="New Email"
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="newemail@example.com"
                                />
                                <Input
                                    label="Current Password"
                                    type="password"
                                    value={emailPassword}
                                    onChange={(e) => setEmailPassword(e.target.value)}
                                    placeholder="Enter your password to confirm"
                                />
                                <Button type="submit" loading={emailLoading}>
                                    Change Email
                                </Button>
                            </form>
                        </div>

                        {/* Change Password */}
                        <div className="card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Lock className="w-5 h-5 text-accent" />
                                <h2 className="text-lg font-semibold">Change Password</h2>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <Input
                                    label="Current Password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <Input
                                    label="New Password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                />
                                <Input
                                    label="Confirm New Password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <Button type="submit" loading={loading}>
                                    Change Password
                                </Button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
