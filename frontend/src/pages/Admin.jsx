/**
 * Admin Page
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
    Users,
    HardDrive,
    Download,
    Upload,
    Shield,
    Crown,
    UserMinus,
    Search,
    MoreVertical,
    Ban,
    AlertTriangle,
    CheckCircle,
    Trash2,
    Eye
} from 'lucide-react';
import { adminApi } from '../api/admin';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { LoadingScreen } from '../components/ui/Spinner';
import ConfirmModal from '../components/ui/ConfirmModal';
import { formatBytes, formatDate, getInitials, getAvatarColor } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Admin() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ type: '', userId: null, userEmail: '' });
    const [actionLoading, setActionLoading] = useState(false);
    const [premiumDuration, setPremiumDuration] = useState(null); // null = lifetime

    // Premium duration options (in months)
    const premiumDurations = [
        { label: 'Lifetime', value: null },
        { label: '1 Month', value: 1 },
        { label: '3 Months', value: 3 },
        { label: '6 Months', value: 6 },
        { label: '1 Year', value: 12 },
        { label: '3 Years', value: 36 },
        { label: '5 Years', value: 60 },
        { label: '10 Years', value: 120 },
        { label: '20 Years', value: 240 },
        { label: '50 Years', value: 600 },
    ];

    // DMCA Bulk Delete state
    const [bulkDeleteLinks, setBulkDeleteLinks] = useState('');
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
    const [bulkDeleteResult, setBulkDeleteResult] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsData, usersData] = await Promise.all([
                adminApi.getStats(),
                adminApi.getUsers(1, 50),
            ]);
            setStats(statsData);
            setUsers(usersData.users || []);
        } catch (error) {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const openPromoteModal = (userId, userEmail) => {
        setPremiumDuration(null); // Reset to lifetime
        setModalConfig({ type: 'promote', userId, userEmail });
        setModalOpen(true);
    };

    const openDemoteModal = (userId, userEmail) => {
        setModalConfig({ type: 'demote', userId, userEmail });
        setModalOpen(true);
    };

    const openBlockModal = (userId, userEmail) => {
        setModalConfig({ type: 'block', userId, userEmail });
        setModalOpen(true);
    };

    const openRestrictModal = (userId, userEmail) => {
        setModalConfig({ type: 'restrict', userId, userEmail });
        setModalOpen(true);
    };

    const openUnblockModal = (userId, userEmail) => {
        setModalConfig({ type: 'unblock', userId, userEmail });
        setModalOpen(true);
    };

    const handleConfirmAction = async () => {
        setActionLoading(true);
        try {
            switch (modalConfig.type) {
                case 'promote':
                    await adminApi.promoteUser(modalConfig.userId, premiumDuration);
                    const durationText = premiumDuration
                        ? premiumDurations.find(d => d.value === premiumDuration)?.label
                        : 'Lifetime';
                    toast.success(`User promoted to premium (${durationText})`);
                    break;
                case 'demote':
                    await adminApi.demoteUser(modalConfig.userId);
                    toast.success('User demoted to free');
                    break;
                case 'block':
                    const blockResult = await adminApi.blockUser(modalConfig.userId);
                    toast.success(`User blocked. ${blockResult.deletedFiles} files deleted.`);
                    break;
                case 'restrict':
                    await adminApi.restrictUser(modalConfig.userId);
                    toast.success('User restricted. Uploads disabled.');
                    break;
                case 'unblock':
                    await adminApi.unblockUser(modalConfig.userId);
                    toast.success('User unblocked');
                    break;
            }
            setModalOpen(false);
            loadData();
        } catch (error) {
            toast.error(`Failed to ${modalConfig.type} user`);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle DMCA bulk delete
    const handleBulkDelete = async () => {
        if (!bulkDeleteLinks.trim()) {
            toast.error('Please paste file links to delete');
            return;
        }

        // Parse links and extract file IDs
        const lines = bulkDeleteLinks.split('\n').map(l => l.trim()).filter(l => l);
        const fileIds = [];

        for (const line of lines) {
            // Match patterns like /d/fileId or file IDs directly
            const match = line.match(/\/d\/([a-f0-9]{24})/i) || line.match(/^([a-f0-9]{24})$/i);
            if (match) {
                fileIds.push(match[1]);
            }
        }

        if (fileIds.length === 0) {
            toast.error('No valid file links found. Links should be like: /d/fileId');
            return;
        }

        if (fileIds.length > 100) {
            toast.error('Maximum 100 files can be deleted at once');
            return;
        }

        setBulkDeleteLoading(true);
        setBulkDeleteResult(null);

        try {
            const result = await adminApi.bulkDeleteFiles(fileIds);
            setBulkDeleteResult(result);
            toast.success(`Deleted ${result.deleted.length} files`);
            if (result.deleted.length > 0) {
                loadData(); // Refresh stats
            }
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Bulk delete failed');
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    const filteredUsers = users.filter((user) => {
        if (search && !user.email.toLowerCase().includes(search.toLowerCase())) {
            return false;
        }
        if (roleFilter && user.role !== roleFilter) {
            return false;
        }
        return true;
    });

    if (loading) {
        return <LoadingScreen message="Loading admin panel..." />;
    }

    const statCards = [
        { label: 'Total Users', value: stats?.users?.total || 0, icon: Users, color: 'text-blue-500' },
        { label: 'Total Files', value: stats?.files?.total || 0, icon: Upload, color: 'text-green-500' },
        { label: 'Storage Used', value: formatBytes(stats?.storage?.used || 0), icon: HardDrive, color: 'text-purple-500' },
        { label: 'Total Downloads', value: stats?.downloads?.total || 0, icon: Download, color: 'text-accent' },
    ];

    return (
        <>
            <Helmet>
                <title>Admin Panel - CloudVault</title>
            </Helmet>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-3 mb-8">
                        <Shield className="w-8 h-8 text-accent" />
                        <div>
                            <h1 className="text-2xl font-bold">Admin Panel</h1>
                            <p className="text-gray-600 dark:text-gray-400">Manage users and system</p>
                        </div>
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
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                                        <p className="text-xl font-semibold">{stat.value}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* DMCA Bulk Delete Section */}
                    <div className="card p-6 mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            <div>
                                <h2 className="text-lg font-semibold">DMCA / Bulk Delete</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Delete multiple files at once (up to 100)</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={bulkDeleteLinks}
                                onChange={(e) => setBulkDeleteLinks(e.target.value)}
                                placeholder={`Paste file links here, one per line:\nhttp://localhost:5173/d/696faca35932022b8a5cb97c\nhttp://localhost:5173/d/696faca35932022b8a5cb97d\n696faca35932022b8a5cb97e`}
                                className="input w-full h-32 font-mono text-sm resize-none"
                            />

                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={handleBulkDelete}
                                    loading={bulkDeleteLoading}
                                    icon={Trash2}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    Delete Files
                                </Button>
                                {bulkDeleteLinks && (
                                    <button
                                        onClick={() => { setBulkDeleteLinks(''); setBulkDeleteResult(null); }}
                                        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Results */}
                            {bulkDeleteResult && (
                                <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-dark-700 space-y-2">
                                    <div className="flex gap-4 text-sm">
                                        <span className="text-green-600 dark:text-green-400">
                                            ✓ Deleted: {bulkDeleteResult.deleted.length}
                                        </span>
                                        <span className="text-orange-600 dark:text-orange-400">
                                            ⊘ Skipped: {bulkDeleteResult.skipped.length}
                                        </span>
                                        <span className="text-red-600 dark:text-red-400">
                                            ✗ Failed: {bulkDeleteResult.failed.length}
                                        </span>
                                    </div>

                                    {bulkDeleteResult.skipped.length > 0 && (
                                        <details className="text-xs text-gray-500">
                                            <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                                                View skipped files
                                            </summary>
                                            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                                {bulkDeleteResult.skipped.map((s, i) => (
                                                    <div key={i} className="font-mono">
                                                        {s.fileId}: {s.reason}
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Management */}
                    <div className="card overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <Input
                                        icon={Search}
                                        placeholder="Search users..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="input max-w-[150px]"
                                >
                                    <option value="">All Roles</option>
                                    <option value="free">Free</option>
                                    <option value="premium">Premium</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-dark-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                                            <td className="px-4 py-3">
                                                <div
                                                    className="flex items-center gap-3 cursor-pointer group"
                                                    onClick={() => navigate(`/admin/view-user/${user._id}`)}
                                                    title="View user's dashboard"
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(user.email)} group-hover:ring-2 group-hover:ring-accent/50 transition-all`}>
                                                        {getInitials(user.email)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium group-hover:text-accent transition-colors">{user.email}</span>
                                                        <Eye className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : user.role === 'premium'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        : 'bg-gray-100 text-gray-700 dark:bg-dark-600 dark:text-gray-400'
                                                    }`}>
                                                    {user.role === 'premium' && <Crown className="w-3 h-3" />}
                                                    {user.role === 'admin' && <Shield className="w-3 h-3" />}
                                                    {user.role}
                                                </span>
                                                {/* Status Badge */}
                                                {user.status && user.status !== 'active' && (
                                                    <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.status === 'blocked'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                        }`}>
                                                        {user.status === 'blocked' && <Ban className="w-3 h-3" />}
                                                        {user.status === 'restricted' && <AlertTriangle className="w-3 h-3" />}
                                                        {user.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {formatBytes(user.storageUsed || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {user.role !== 'admin' && (
                                                    <div className="flex justify-end gap-1 flex-wrap">
                                                        {/* Promote/Demote - only for active users */}
                                                        {(!user.status || user.status === 'active') && (
                                                            <>
                                                                {user.role === 'free' ? (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        icon={Crown}
                                                                        onClick={() => openPromoteModal(user._id, user.email || user.username)}
                                                                    >
                                                                        Promote
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        icon={UserMinus}
                                                                        onClick={() => openDemoteModal(user._id, user.email || user.username)}
                                                                    >
                                                                        Demote
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Block/Restrict/Unblock based on current status */}
                                                        {user.status === 'blocked' || user.status === 'restricted' ? (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                icon={CheckCircle}
                                                                onClick={() => openUnblockModal(user._id, user.email || user.username)}
                                                                className="text-green-600 hover:text-green-700"
                                                            >
                                                                Unblock
                                                            </Button>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    icon={AlertTriangle}
                                                                    onClick={() => openRestrictModal(user._id, user.email || user.username)}
                                                                    className="text-orange-600 hover:text-orange-700"
                                                                >
                                                                    Restrict
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    icon={Ban}
                                                                    onClick={() => openBlockModal(user._id, user.email || user.username)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    Block
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredUsers.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No users found
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleConfirmAction}
                title={
                    modalConfig.type === 'promote' ? 'Promote User to Premium' :
                        modalConfig.type === 'demote' ? 'Demote User to Free' :
                            modalConfig.type === 'block' ? '⛔ Block User Account' :
                                modalConfig.type === 'restrict' ? '⚠️ Restrict User Account' :
                                    modalConfig.type === 'unblock' ? 'Unblock User Account' : ''
                }
                message={
                    modalConfig.type === 'promote' ? `Are you sure you want to promote "${modalConfig.userEmail}" to Premium?` :
                        modalConfig.type === 'demote' ? `Are you sure you want to demote "${modalConfig.userEmail}" to Free tier?` :
                            modalConfig.type === 'block' ? `Are you sure you want to BLOCK "${modalConfig.userEmail}"? This action is severe and irreversible!` :
                                modalConfig.type === 'restrict' ? `Are you sure you want to restrict "${modalConfig.userEmail}"?` :
                                    modalConfig.type === 'unblock' ? `Are you sure you want to unblock "${modalConfig.userEmail}"?` : ''
                }
                details={
                    modalConfig.type === 'promote' ? ['Unlimited storage space', 'No file size restrictions', 'Priority support access'] :
                        modalConfig.type === 'demote' ? ['Storage limited to 50GB', 'File size restrictions apply', 'Premium features removed'] :
                            modalConfig.type === 'block' ? ['ALL files will be permanently DELETED', 'Download links will stop working', 'User cannot log in anymore', 'This action cannot be undone'] :
                                modalConfig.type === 'restrict' ? ['User cannot upload new files', 'Existing files remain accessible', 'Download links stay active', 'Account can be unblocked later'] :
                                    modalConfig.type === 'unblock' ? ['User can log in again', 'User can upload new files', 'Account restored to normal'] : []
                }
                note={
                    modalConfig.type === 'demote' ? 'Existing files beyond quota will remain, but new uploads will be blocked.' :
                        modalConfig.type === 'block' ? 'WARNING: All user data will be permanently deleted from storage!' :
                            ''
                }
                confirmText={
                    modalConfig.type === 'promote' ? 'Promote to Premium' :
                        modalConfig.type === 'demote' ? 'Demote to Free' :
                            modalConfig.type === 'block' ? 'Block & Delete All Files' :
                                modalConfig.type === 'restrict' ? 'Restrict User' :
                                    modalConfig.type === 'unblock' ? 'Unblock User' : 'Confirm'
                }
                variant={
                    modalConfig.type === 'promote' ? 'warning' :
                        modalConfig.type === 'block' ? 'danger' :
                            modalConfig.type === 'restrict' ? 'warning' :
                                modalConfig.type === 'unblock' ? 'info' : 'danger'
                }
                loading={actionLoading}
            >
                {/* Premium Duration Selector */}
                {modalConfig.type === 'promote' && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Premium Duration
                        </label>
                        <select
                            value={premiumDuration === null ? '' : premiumDuration}
                            onChange={(e) => setPremiumDuration(e.target.value === '' ? null : parseInt(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            {premiumDurations.map((option) => (
                                <option key={option.label} value={option.value === null ? '' : option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </ConfirmModal>
        </>
    );
}
