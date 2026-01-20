/**
 * File Details Page
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
    Download,
    Copy,
    Trash2,
    ArrowLeft,
    File,
    Image,
    Film,
    Music,
    FileText,
    HardDrive,
    Clock,
    Edit3,
    Check,
    X
} from 'lucide-react';
import { filesApi } from '../api/files';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { LoadingScreen } from '../components/ui/Spinner';
import { formatBytes, formatDate, getFileIcon, copyToClipboard, canPreview } from '../utils/helpers';
import toast from 'react-hot-toast';

const iconMap = {
    file: File,
    image: Image,
    video: Film,
    music: Music,
    'file-text': FileText,
};

export default function FileDetails() {
    const { fileId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newFilename, setNewFilename] = useState('');

    useEffect(() => {
        loadFile();
    }, [fileId]);

    const loadFile = async () => {
        try {
            const response = await filesApi.getFileInfo(fileId);
            const fileData = response.file || response;
            setFile(fileData);
            setNewFilename(fileData.filename || fileData.originalName || '');
        } catch (error) {
            toast.error('File not found');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        window.open(`/api/download/${fileId}`, '_blank');
    };

    const handleCopy = async () => {
        const url = `${window.location.origin}/file/${fileId}`;
        const success = await copyToClipboard(url);
        if (success) {
            toast.success('Link copied!');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await filesApi.deleteFile(fileId);
            toast.success('File deleted');
            navigate('/dashboard');
        } catch (error) {
            toast.error('Failed to delete file');
        }
    };

    const handleRename = async () => {
        if (!newFilename.trim() || newFilename === file.filename) {
            setIsRenaming(false);
            return;
        }

        try {
            await filesApi.renameFile(fileId, newFilename.trim());
            setFile(prev => ({ ...prev, filename: newFilename.trim() }));
            toast.success('File renamed');
            setIsRenaming(false);
        } catch (error) {
            toast.error('Failed to rename file');
        }
    };

    const cancelRename = () => {
        setNewFilename(file.filename || file.originalName || '');
        setIsRenaming(false);
    };

    if (loading) {
        return <LoadingScreen message="Loading file..." />;
    }

    if (!file) {
        return null;
    }

    const Icon = iconMap[getFileIcon(file.mimeType)] || File;
    const isOwner = user && (file.userId === user._id || file.owner === user._id);
    const showPreview = canPreview(file.mimeType);
    const displayFilename = file.filename || file.originalName || 'Unknown';
    const uploadDate = file.createdAt || file.uploadedAt;

    return (
        <>
            <Helmet>
                <title>{displayFilename} - CloudVault</title>
                <meta name="description" content={`Download ${displayFilename} (${formatBytes(file.size)}) - ${file.downloads || 0} downloads`} />
                <meta property="og:title" content={displayFilename} />
                <meta property="og:description" content={`${formatBytes(file.size)} • ${file.downloads || 0} downloads`} />
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    {/* File Card */}
                    <div className="card overflow-hidden">
                        {/* Preview Area */}
                        {showPreview && (
                            <div className="bg-gray-100 dark:bg-dark-700 p-8 flex items-center justify-center min-h-[300px]">
                                {file.mimeType?.startsWith('image/') ? (
                                    <img
                                        src={`/api/download/${fileId}`}
                                        alt={displayFilename}
                                        className="max-w-full max-h-[400px] rounded-lg shadow-lg"
                                    />
                                ) : file.mimeType?.startsWith('video/') ? (
                                    <video
                                        src={`/api/download/${fileId}`}
                                        controls
                                        className="max-w-full max-h-[400px] rounded-lg"
                                    />
                                ) : file.mimeType?.startsWith('audio/') ? (
                                    <audio
                                        src={`/api/download/${fileId}`}
                                        controls
                                        className="w-full max-w-md"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-xl bg-accent/10 flex items-center justify-center">
                                        <Icon className="w-12 h-12 text-accent" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info */}
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                {!showPreview && (
                                    <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-8 h-8 text-accent" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    {isRenaming ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={newFilename}
                                                onChange={(e) => setNewFilename(e.target.value)}
                                                className="input flex-1 text-xl font-bold"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRename();
                                                    if (e.key === 'Escape') cancelRename();
                                                }}
                                            />
                                            <button onClick={handleRename} className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded">
                                                <Check className="w-5 h-5" />
                                            </button>
                                            <button onClick={cancelRename} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-xl font-bold truncate">{displayFilename}</h1>
                                            {isOwner && (
                                                <button
                                                    onClick={() => setIsRenaming(true)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    title="Rename file"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        {file.mimeType || 'Unknown type'}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                        <HardDrive className="w-4 h-4" />
                                        Size
                                    </div>
                                    <p className="font-semibold mt-1">{formatBytes(file.size)}</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                        <Download className="w-4 h-4" />
                                        Downloads
                                    </div>
                                    <p className="font-semibold mt-1">{file.downloads || 0}</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                        <Clock className="w-4 h-4" />
                                        Uploaded
                                    </div>
                                    <p className="font-semibold mt-1">{formatDate(uploadDate)}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-3 mt-6">
                                <Button icon={Download} onClick={handleDownload}>
                                    Download
                                </Button>
                                <Button variant="secondary" icon={Copy} onClick={handleCopy}>
                                    Copy Link
                                </Button>
                                {isOwner && (
                                    <Button variant="danger" icon={Trash2} onClick={handleDelete}>
                                        Delete
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}
