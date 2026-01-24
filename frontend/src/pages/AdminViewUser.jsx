/**
 * AdminViewUser Page
 * Admin can view any user's dashboard, files, folders, and analytics
 * Includes edit mode for file management (delete, copy link)
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Eye,
    HardDrive,
    Upload,
    Download,
    Folder,
    FileIcon,
    ChevronRight,
    Home,
    Clock,
    BarChart3,
    Image,
    Video,
    Music,
    FileText,
    Archive,
    File as FileDefault,
    Crown,
    User as UserIcon,
    Pencil,
    Trash2,
    Link,
    X,
    TrendingUp,
    Activity,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { LoadingScreen } from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';
import { formatBytes, formatRelativeTime } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function AdminViewUser() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [folderContents, setFolderContents] = useState({ folders: [], files: [], breadcrumb: [] });
    const [analytics, setAnalytics] = useState(null);
    const [activeTab, setActiveTab] = useState('files'); // 'files' | 'analytics'

    // Edit mode state
    const [editMode, setEditMode] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Analytics period state
    const [analyticsPeriod, setAnalyticsPeriod] = useState(30);

    // Load user dashboard data
    useEffect(() => {
        const loadUserData = async () => {
            try {
                setLoading(true);
                const data = await adminApi.getUserDashboard(userId);
                setUserData(data);
            } catch (error) {
                toast.error('Failed to load user data');
                navigate('/admin');
            } finally {
                setLoading(false);
            }
        };
        loadUserData();
    }, [userId, navigate]);

    // Load folder contents
    const loadFolderContents = useCallback(async (folderId) => {
        try {
            const data = await adminApi.getUserFolderContents(userId, folderId);
            setFolderContents(data);
        } catch (error) {
            toast.error('Failed to load folder contents');
        }
    }, [userId]);

    useEffect(() => {
        if (userData) {
            loadFolderContents(currentFolderId);
        }
    }, [userData, currentFolderId, loadFolderContents]);

    // Load analytics
    const loadAnalytics = useCallback(async (period) => {
        try {
            const data = await adminApi.getUserAnalytics(userId, period);
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }, [userId]);

    useEffect(() => {
        if (userData && activeTab === 'analytics') {
            loadAnalytics(analyticsPeriod);
        }
    }, [userData, activeTab, analyticsPeriod, loadAnalytics]);

    const navigateToFolder = (folderId) => {
        setCurrentFolderId(folderId || 'root');
    };

    const getFileIcon = (mimeType) => {
        if (!mimeType) return FileDefault;
        if (mimeType.startsWith('image/')) return Image;
        if (mimeType.startsWith('video/')) return Video;
        if (mimeType.startsWith('audio/')) return Music;
        if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
        if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return Archive;
        return FileDefault;
    };

    const getRoleBadge = (role) => {
        const badges = {
            admin: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
            premium: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
            free: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
        };
        return badges[role] || badges.free;
    };

    // Copy download link
    const handleCopyLink = (fileId) => {
        const link = `${window.location.origin}/d/${fileId}`;
        navigator.clipboard.writeText(link);
        toast.success('Download link copied!');
    };

    // Delete file
    const handleDeleteClick = (file) => {
        setFileToDelete(file);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!fileToDelete) return;

        setDeleteLoading(true);
        try {
            await adminApi.forceDeleteFile(fileToDelete.id);
            toast.success('File deleted successfully');
            loadFolderContents(currentFolderId);
            // Update quota
            const data = await adminApi.getUserDashboard(userId);
            setUserData(data);
        } catch (error) {
            toast.error('Failed to delete file');
        } finally {
            setDeleteLoading(false);
            setDeleteModalOpen(false);
            setFileToDelete(null);
        }
    };

    if (loading) return <LoadingScreen />;
    if (!userData) return null;

    const { user, quota } = userData;
    const roleBadge = getRoleBadge(user.role);

    const statCards = [
        { label: 'Storage Used', value: formatBytes(quota.storage.used), icon: HardDrive, color: 'text-blue-500' },
        { label: 'Total Files', value: quota.files.count, icon: Upload, color: 'text-green-500' },
        { label: 'Total Folders', value: quota.folders.count, icon: Folder, color: 'text-amber-500' },
        { label: 'Total Downloads', value: quota.downloads.total, icon: Download, color: 'text-purple-500' },
    ];

    return (
        <>
            <Helmet>
                <title>Viewing: {user.email} - Admin</title>
            </Helmet>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Admin Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
                >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/20">
                                <Eye className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Admin View Mode</p>
                                <p className="font-semibold">{user.email}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                                {user.role === 'premium' && <Crown className="w-3 h-3 inline mr-1" />}
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Edit Mode Toggle */}
                            <Button
                                variant={editMode ? 'danger' : 'secondary'}
                                icon={editMode ? X : Pencil}
                                onClick={() => setEditMode(!editMode)}
                            >
                                {editMode ? 'Exit Edit' : 'Edit Mode'}
                            </Button>
                            <Button
                                variant="secondary"
                                icon={ArrowLeft}
                                onClick={() => navigate('/admin')}
                            >
                                Exit View
                            </Button>
                        </div>
                    </div>
                </motion.div>

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

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'files'
                                ? 'bg-accent text-white'
                                : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600'
                            }`}
                    >
                        <Folder className="w-4 h-4 inline mr-2" />
                        Files & Folders
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'analytics'
                                ? 'bg-accent text-white'
                                : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600'
                            }`}
                    >
                        <BarChart3 className="w-4 h-4 inline mr-2" />
                        Analytics
                    </button>
                </div>

                {/* Files Tab */}
                {activeTab === 'files' && (
                    <motion.div
                        key="files"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="card p-6"
                    >
                        {/* Edit Mode Banner */}
                        {editMode && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <Pencil className="w-4 h-4" />
                                    <strong>Edit Mode:</strong> You can delete files or copy their download links.
                                </p>
                            </div>
                        )}

                        {/* Breadcrumb */}
                        <div className="flex items-center gap-1 text-sm mb-4 flex-wrap">
                            <button
                                onClick={() => navigateToFolder('root')}
                                className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-accent"
                            >
                                <Home className="w-4 h-4" />
                                <span>Root</span>
                            </button>
                            {folderContents.breadcrumb.map((crumb) => (
                                <div key={crumb.id} className="flex items-center gap-1">
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                    <button
                                        onClick={() => navigateToFolder(crumb.id)}
                                        className="text-gray-600 dark:text-gray-400 hover:text-accent"
                                    >
                                        {crumb.name}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Contents */}
                        <div className="space-y-2">
                            {folderContents.folders.length === 0 && folderContents.files.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>This folder is empty</p>
                                </div>
                            ) : (
                                <>
                                    {/* Folders */}
                                    {folderContents.folders.map((folder) => (
                                        <motion.div
                                            key={folder.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer"
                                            onClick={() => navigateToFolder(folder.id)}
                                        >
                                            <Folder className="w-5 h-5 text-amber-500" />
                                            <span className="flex-1 font-medium">{folder.name}</span>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </motion.div>
                                    ))}

                                    {/* Files */}
                                    {folderContents.files.map((file) => {
                                        const Icon = getFileIcon(file.mimeType);
                                        return (
                                            <motion.div
                                                key={file.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700"
                                            >
                                                <Icon className="w-5 h-5 text-blue-500" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{file.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatBytes(file.size)} • {file.downloads} downloads
                                                        {file.expiresAt && ` • Expires ${formatRelativeTime(file.expiresAt)}`}
                                                    </p>
                                                </div>
                                                {/* Edit Mode Actions */}
                                                {editMode && (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleCopyLink(file.id)}
                                                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-500 hover:text-blue-500 transition-colors"
                                                            title="Copy download link"
                                                        >
                                                            <Link className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(file)}
                                                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 transition-colors"
                                                            title="Delete file"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <motion.div
                        key="analytics"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        {/* Period Selector & Summary */}
                        <div className="card p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <h3 className="text-lg font-semibold">Download Analytics</h3>
                                <div className="flex gap-2">
                                    {[7, 30, 90].map((days) => (
                                        <button
                                            key={days}
                                            onClick={() => setAnalyticsPeriod(days)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${analyticsPeriod === days
                                                    ? 'bg-accent text-white'
                                                    : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600'
                                                }`}
                                        >
                                            {days}d
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Stats */}
                            {analytics && (
                                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-dark-700">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                                            <Download className="w-4 h-4" />
                                            <span className="text-sm">Period Total</span>
                                        </div>
                                        <p className="text-2xl font-bold">{analytics.period?.total || 0}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-dark-700">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                                            <Activity className="w-4 h-4" />
                                            <span className="text-sm">Avg/Day</span>
                                        </div>
                                        <p className="text-2xl font-bold">{analytics.period?.avgPerDay || 0}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-dark-700">
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="text-sm">Total Downloads</span>
                                        </div>
                                        <p className="text-2xl font-bold">{analytics.summary?.totalDownloads || 0}</p>
                                    </div>
                                </div>
                            )}

                            {/* Chart */}
                            {analytics?.dailyData ? (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={analytics.dailyData}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(value) => value.split('-').slice(1).join('/')}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="downloads"
                                                stroke="#8b5cf6"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500">
                                    Loading analytics...
                                </div>
                            )}
                        </div>

                        {/* Top Files */}
                        <div className="card p-6">
                            <h3 className="text-lg font-semibold mb-4">Top Downloaded Files</h3>
                            {analytics?.topFiles?.length > 0 ? (
                                <div className="space-y-2">
                                    {analytics.topFiles.map((file, index) => {
                                        const Icon = getFileIcon(file.mimeType);
                                        return (
                                            <div
                                                key={file.id}
                                                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-700"
                                            >
                                                <span className="text-lg font-bold text-gray-400 w-6">
                                                    #{index + 1}
                                                </span>
                                                <Icon className="w-5 h-5 text-blue-500" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{file.filename}</p>
                                                    <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-accent">{file.downloads}</p>
                                                    <p className="text-xs text-gray-500">downloads</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No download data yet
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setFileToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                loading={deleteLoading}
                title="Delete File"
                message={`Are you sure you want to permanently delete "${fileToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmVariant="danger"
            />
        </>
    );
}
