/**
 * Public Download Page
 * Anyone with the link can download the file
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileIcon, ArrowLeft, Loader2, AlertCircle, Cloud } from 'lucide-react';
import { formatBytes } from '../utils/helpers';
import Button from '../components/ui/Button';

export default function PublicDownload() {
    const { fileId } = useParams();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        loadFile();
    }, [fileId]);

    const loadFile = async () => {
        try {
            setLoading(true);
            // Use direct fetch without auth - public endpoint
            const response = await fetch(`/api/download/info/${fileId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'File not found');
            }
            const data = await response.json();
            setFile(data);
            setError(null);
        } catch (err) {
            setError(err.message || 'File not found or expired');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            // Use the correct public download endpoint
            const downloadUrl = `/api/download/${fileId}`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = file.filename || file.originalName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setTimeout(() => setDownloading(false), 2000);
        }
    };

    const getFileTypeIcon = (mimeType) => {
        return <FileIcon className="w-16 h-16 text-accent" />;
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-accent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md"
                >
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">File Not Available</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <Link to="/">
                        <Button variant="ghost" icon={ArrowLeft}>
                            Go to Home
                        </Button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-accent to-purple-600 p-6 text-white text-center">
                        <Cloud className="w-12 h-12 mx-auto mb-3 opacity-90" />
                        <h1 className="text-xl font-bold">File Ready to Download</h1>
                    </div>

                    {/* File Info */}
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            {getFileTypeIcon(file.mimeType)}
                            <div className="flex-1 min-w-0">
                                <h2 className="font-semibold text-lg truncate" title={file.originalName || file.filename}>
                                    {file.originalName || file.filename}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {formatBytes(file.size)}
                                </p>
                            </div>
                        </div>

                        {/* Download Button */}
                        <Button
                            onClick={handleDownload}
                            loading={downloading}
                            icon={Download}
                            className="w-full text-lg py-3"
                        >
                            {downloading ? 'Starting Download...' : 'Download File'}
                        </Button>

                        {/* Stats */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-700">
                            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Downloads</span>
                                <span className="font-medium">{file.downloads || 0}</span>
                            </div>
                            {file.expiresAt && (
                                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    <span>Expires</span>
                                    <span className="font-medium">
                                        {new Date(file.expiresAt).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-dark-900/50 px-6 py-4 text-center">
                        <Link
                            to="/"
                            className="text-sm text-accent hover:underline"
                        >
                            Upload your own files →
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
