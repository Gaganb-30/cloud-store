/**
 * FileUploader Component
 * Drag and drop file upload with speed indicator and cancel support
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2, Zap, XCircle, Ban, Lock } from 'lucide-react';
import { useUpload } from '../../context/UploadContext';
import { useAuth } from '../../context/AuthContext';
import { formatBytes, formatSpeed } from '../../utils/helpers';
import Button from '../ui/Button';

// Format eta to human readable
function formatEta(seconds) {
    if (!seconds || seconds <= 0) return '';
    if (seconds < 60) return `${seconds}s left`;
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m left`;
    return `${Math.floor(seconds / 3600)}h ${Math.ceil((seconds % 3600) / 60)}m left`;
}

export default function FileUploader({ targetFolderId = null }) {
    const [isDragging, setIsDragging] = useState(false);
    const { queue, addFile, removeFile, cancelUpload, startUpload, uploading, pendingCount } = useUpload();
    const { user } = useAuth();

    // Check if user is restricted
    const isRestricted = user?.status === 'restricted';

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        if (!isRestricted) {
            setIsDragging(true);
        }
    }, [isRestricted]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        if (isRestricted) return; // Block drop for restricted users

        const files = Array.from(e.dataTransfer.files);
        files.forEach((file) => addFile(file, targetFolderId));
    }, [addFile, targetFolderId, isRestricted]);

    const handleFileSelect = useCallback((e) => {
        if (isRestricted) return; // Block file select for restricted users

        const files = Array.from(e.target.files || []);
        files.forEach((file) => addFile(file, targetFolderId));
        e.target.value = '';
    }, [addFile, targetFolderId, isRestricted]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'cancelled':
                return <XCircle className="w-5 h-5 text-gray-400" />;
            case 'uploading':
            case 'initializing':
            case 'completing':
                return <Loader2 className="w-5 h-5 text-accent animate-spin" />;
            default:
                return <File className="w-5 h-5 text-gray-400" />;
        }
    };

    const isUploadingStatus = (status) => {
        return ['uploading', 'initializing', 'completing'].includes(status) ||
            (typeof status === 'string' && status.includes('rate limited'));
    };

    return (
        <div className="space-y-6">
            {/* Drop Zone - Restricted State */}
            {isRestricted ? (
                <div className="relative border-2 border-dashed rounded-xl p-12 text-center border-red-300 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 opacity-75 cursor-not-allowed">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                            <Lock className="w-8 h-8 text-red-500" />
                        </div>

                        <div>
                            <p className="text-lg font-medium text-red-600 dark:text-red-400">
                                Account Restricted
                            </p>
                            <p className="text-sm text-red-500/80 dark:text-red-400/60 mt-1">
                                Your account has been restricted. You cannot upload files.
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                Please contact support for assistance.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Drop Zone - Normal State */
                <motion.div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    animate={{
                        scale: isDragging ? 1.02 : 1,
                        borderColor: isDragging ? '#ff3b5c' : undefined,
                    }}
                    className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-colors
          ${isDragging
                            ? 'border-accent bg-accent/5'
                            : 'border-gray-300 dark:border-dark-600 hover:border-gray-400 dark:hover:border-dark-500'
                        }
        `}
                >
                    <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDragging ? 'bg-accent/20' : 'bg-gray-100 dark:bg-dark-700'
                            }`}>
                            <Upload className={`w-8 h-8 ${isDragging ? 'text-accent' : 'text-gray-400'}`} />
                        </div>

                        <div>
                            <p className="text-lg font-medium">
                                {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                or click to browse • Max 10GB per file
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Upload Queue */}
            <AnimatePresence>
                {queue.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">Upload Queue ({queue.length})</h3>
                            {pendingCount > 0 && !uploading && (
                                <Button onClick={startUpload} size="sm">
                                    Start Upload
                                </Button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {queue.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="card p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(item.status)}

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{item.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {formatBytes(item.size)}
                                                {item.status === 'uploading' && ` • ${item.progress}%`}
                                                {item.status === 'error' && ` • ${item.error}`}
                                                {item.status === 'cancelled' && ' • Cancelled'}
                                            </p>
                                        </div>

                                        {/* Speed indicator */}
                                        {item.status === 'uploading' && item.speed > 0 && (
                                            <div className="text-right hidden sm:block">
                                                <div className="flex items-center gap-1 text-accent font-medium">
                                                    <Zap className="w-4 h-4" />
                                                    {formatSpeed(item.speed)}
                                                </div>
                                                {item.eta && (
                                                    <p className="text-xs text-gray-500">
                                                        {formatEta(item.eta)}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Remove button for pending files */}
                                        {item.status === 'pending' && (
                                            <button
                                                onClick={() => removeFile(item.id)}
                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded transition-colors"
                                                title="Remove from queue"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}

                                        {/* Cancel button for uploading files */}
                                        {isUploadingStatus(item.status) && (
                                            <button
                                                onClick={() => cancelUpload(item.id)}
                                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded transition-colors"
                                                title="Cancel upload"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Progress Bar */}
                                    {(item.status === 'uploading' || item.status === 'completing') && (
                                        <div className="mt-3">
                                            <div className="h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.progress}%` }}
                                                    className="h-full bg-accent rounded-full"
                                                />
                                            </div>
                                            {/* Mobile speed display */}
                                            {item.speed > 0 && (
                                                <div className="flex justify-between mt-1 text-xs text-gray-500 sm:hidden">
                                                    <span className="text-accent">{formatSpeed(item.speed)}</span>
                                                    {item.eta && <span>{formatEta(item.eta)}</span>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
