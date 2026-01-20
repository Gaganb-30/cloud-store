/**
 * Analytics Page
 * Download trends, stats, and top files
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Download,
    FileIcon,
    TrendingUp,
    Loader2,
    FolderOpen,
    Activity
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { analyticsApi } from '../api/analytics';
import { formatBytes } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(30);
    const [avgPeriod, setAvgPeriod] = useState(30); // Separate period for daily avg card
    const [data, setData] = useState(null);
    const [avgData, setAvgData] = useState(null); // Data for avg period

    useEffect(() => {
        loadAnalytics();
    }, [period]);

    useEffect(() => {
        loadAvgData();
    }, [avgPeriod]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const response = await analyticsApi.getAnalytics(period);
            setData(response);
            // Also load avg data if same period
            if (avgPeriod === period) {
                setAvgData(response);
            }
        } catch (error) {
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const loadAvgData = async () => {
        try {
            const response = await analyticsApi.getAnalytics(avgPeriod);
            setAvgData(response);
        } catch (error) {
            // Silent fail for avg data
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    const getFileTypeLabel = (mimeType) => {
        if (!mimeType) return 'File';
        if (mimeType.includes('image')) return 'Image';
        if (mimeType.includes('video')) return 'Video';
        if (mimeType.includes('audio')) return 'Audio';
        if (mimeType.includes('pdf')) return 'PDF';
        if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'Archive';
        if (mimeType.includes('application')) return 'Application';
        return 'File';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400">Track your file download activity</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-dark-800 rounded-xl p-6 border border-dark-700"
                >
                    <p className="text-gray-400 text-sm mb-1">Total Downloads</p>
                    <p className="text-3xl font-bold">{formatNumber(data?.summary?.totalDownloads || 0)}</p>
                    <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
                        Total downloads count <Download className="w-4 h-4" />
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-dark-800 rounded-xl p-6 border border-dark-700"
                >
                    <p className="text-gray-400 text-sm mb-1">Total Files</p>
                    <p className="text-3xl font-bold">{data?.summary?.totalFiles || 0}</p>
                    <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
                        Total files count <FolderOpen className="w-4 h-4" />
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-dark-800 rounded-xl p-6 border border-dark-700"
                >
                    <p className="text-gray-400 text-sm mb-1">Daily Average ({avgPeriod}d)</p>
                    <p className="text-3xl font-bold">{avgData?.period?.avgPerDay || 0}</p>
                    <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
                        Daily average downloads <Download className="w-4 h-4" />
                    </p>
                    {/* Mini period selector */}
                    <div className="flex gap-1 mt-3">
                        {[7, 30, 90].map((days) => (
                            <button
                                key={days}
                                onClick={() => setAvgPeriod(days)}
                                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${avgPeriod === days
                                        ? 'bg-accent text-white'
                                        : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                                    }`}
                            >
                                {days}D
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Download Trends */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-dark-800 rounded-xl p-6 border border-dark-700"
            >
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">Download Trends</h2>
                        <p className="text-gray-400 text-sm">Daily download activity for the selected time period</p>
                    </div>

                    {/* Period Selector */}
                    <div className="flex gap-2">
                        {[7, 30, 90].map((days) => (
                            <button
                                key={days}
                                onClick={() => setPeriod(days)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === days
                                    ? 'bg-accent text-white'
                                    : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                                    }`}
                            >
                                {days}D
                            </button>
                        ))}
                    </div>
                </div>

                {/* Period Stats */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div>
                        <p className="text-3xl font-bold">{formatNumber(data?.period?.total || 0)}</p>
                        <p className="text-gray-400 text-sm">Period Total ({period}d)</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{data?.period?.avgPerDay || 0}</p>
                        <p className="text-gray-400 text-sm">Avg per day</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{data?.period?.peakDay || 0}</p>
                        <p className="text-gray-400 text-sm">Peak day</p>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data?.dailyData || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="date"
                                stroke="#6B7280"
                                fontSize={12}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                }}
                            />
                            <YAxis stroke="#6B7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                }}
                                labelStyle={{ color: '#9CA3AF' }}
                                itemStyle={{ color: '#10B981' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="downloads"
                                stroke="#10B981"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: '#10B981' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Top Downloaded Files */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-dark-800 rounded-xl p-6 border border-dark-700"
            >
                <div className="mb-6">
                    <h2 className="text-lg font-semibold">Most Downloaded Files</h2>
                    <p className="text-gray-400 text-sm">Your top 10 performing files by download count</p>
                </div>

                <div className="space-y-2">
                    {data?.topFiles?.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No downloads yet</p>
                    ) : (
                        data?.topFiles?.map((file, index) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className={`flex items-center gap-4 p-4 rounded-xl ${index < 3 ? 'bg-dark-700/50' : 'bg-dark-900/30'
                                    }`}
                            >
                                {/* Rank */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                        index === 2 ? 'bg-orange-500/20 text-orange-500' :
                                            'bg-dark-700 text-gray-500'
                                    }`}>
                                    #{index + 1}
                                </div>

                                {/* File Icon */}
                                <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center">
                                    <FileIcon className="w-5 h-5 text-gray-400" />
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{file.filename}</p>
                                    <p className="text-sm text-gray-500">
                                        {formatBytes(file.size)} • {getFileTypeLabel(file.mimeType)}
                                    </p>
                                </div>

                                {/* Download Count */}
                                <div className="text-right">
                                    <p className="text-2xl font-bold">{file.downloads}</p>
                                    <p className="text-sm text-gray-500">downloads</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
