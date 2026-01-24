/**
 * Dashboard Page
 * Now with folder navigation
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Upload, HardDrive, Download, Clock, Plus, Folder } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FolderBrowser from '../components/files/FolderBrowser';
import Button from '../components/ui/Button';
import { formatBytes } from '../utils/helpers';

export default function Dashboard() {
    const { user, quota, isPremium, refreshUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Refresh quota data when dashboard loads
        refreshUser();
    }, []);

    // Calculate premium time remaining
    const getPremiumTimeRemaining = () => {
        if (!isPremium || !user?.premiumExpiresAt) {
            return null; // Lifetime or not premium
        }

        const now = new Date();
        const expiresAt = new Date(user.premiumExpiresAt);
        const diffMs = expiresAt - now;

        if (diffMs <= 0) return 'Expired';

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (years > 0) {
            return `${years}y ${Math.floor((days % 365) / 30)}m left`;
        } else if (months > 0) {
            return `${months}mo ${days % 30}d left`;
        } else if (days > 0) {
            return `${days} days left`;
        } else {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            return `${hours} hours left`;
        }
    };

    const premiumTimeRemaining = getPremiumTimeRemaining();

    // Get storage from quota (from AuthContext) or fallback to 0
    const storageUsed = quota?.storage?.used || 0;
    const fileCount = quota?.files?.count || 0;
    const totalDownloads = quota?.downloads?.total || 0;

    // Format account type with expiry info
    const getAccountTypeDisplay = () => {
        if (!isPremium) return { value: 'Free', subValue: null, subColor: null };
        if (!premiumTimeRemaining) return { value: 'Premium', subValue: '∞ Lifetime', subColor: 'text-green-500' };
        if (premiumTimeRemaining === 'Expired') return { value: 'Premium', subValue: 'Expired', subColor: 'text-red-500' };

        // Check if less than 7 days
        const now = new Date();
        const expiresAt = new Date(user.premiumExpiresAt);
        const daysLeft = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
        const colorClass = daysLeft <= 7 ? 'text-amber-500' : 'text-green-500';

        return { value: 'Premium', subValue: premiumTimeRemaining, subColor: colorClass };
    };

    const accountDisplay = getAccountTypeDisplay();

    const statCards = [
        { label: 'Storage Used', value: formatBytes(storageUsed), icon: HardDrive, color: 'text-blue-500' },
        { label: 'Total Files', value: fileCount, icon: Upload, color: 'text-green-500' },
        { label: 'Total Folders', value: quota?.folders?.count || 0, icon: Folder, color: 'text-amber-500' },
        { label: 'Account Type', value: accountDisplay.value, subValue: accountDisplay.subValue, subColor: accountDisplay.subColor, icon: Clock, color: 'text-accent' },
    ];

    const handleUploadHere = (folderId) => {
        navigate('/upload', { state: { targetFolderId: folderId } });
    };

    return (
        <>
            <Helmet>
                <title>Dashboard - CloudVault</title>
            </Helmet>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Welcome back, {user?.email?.split('@')[0]}
                        </p>
                    </div>
                    <Link to="/upload">
                        <Button icon={Plus}>Upload Files</Button>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statCards.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="card p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-dark-700 ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                                    <p className="text-xl font-semibold">{stat.value}</p>
                                    {stat.subValue && (
                                        <p className={`text-xs font-medium mt-0.5 ${stat.subColor || 'text-gray-500'}`}>
                                            {stat.subValue}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Folder Browser */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold mb-4">My Files</h2>
                    <FolderBrowser onUploadHere={handleUploadHere} />
                </div>
            </div>
        </>
    );
}
