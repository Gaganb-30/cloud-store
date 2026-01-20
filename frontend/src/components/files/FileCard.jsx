/**
 * FileCard Component
 */
import { motion } from 'framer-motion';
import {
    File,
    Image,
    Film,
    Music,
    FileText,
    Archive,
    Download,
    Trash2,
    Copy,
    MoreVertical,
    Eye
} from 'lucide-react';
import { useState } from 'react';
import { formatBytes, formatRelativeTime, getFileIcon, copyToClipboard } from '../../utils/helpers';
import toast from 'react-hot-toast';

const iconMap = {
    file: File,
    image: Image,
    video: Film,
    music: Music,
    'file-text': FileText,
    archive: Archive,
};

export default function FileCard({ file, onDelete, onDownload }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const Icon = iconMap[getFileIcon(file.mimeType)] || File;

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/file/${file.id}`;
        const success = await copyToClipboard(url);
        if (success) {
            toast.success('Link copied to clipboard!');
        } else {
            toast.error('Failed to copy link');
        }
        setMenuOpen(false);
    };

    const handleDownload = () => {
        window.open(`/api/download/${file.id}`, '_blank');
        setMenuOpen(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card p-4 hover:shadow-xl transition-shadow group"
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-accent/10 dark:bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-accent" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate" title={file.filename}>
                        {file.filename}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>{file.friendlySize || formatBytes(file.size)}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(file.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                        <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {file.downloads || 0} downloads
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 z-20 py-1">
                                <button
                                    onClick={() => { window.open(`/file/${file.id}`, '_blank'); setMenuOpen(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy Link
                                </button>
                                <hr className="my-1 border-gray-200 dark:border-dark-700" />
                                <button
                                    onClick={() => { onDelete?.(file.id); setMenuOpen(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
