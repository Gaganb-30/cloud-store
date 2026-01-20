/**
 * FileList Component
 */
import { AnimatePresence } from 'framer-motion';
import FileCard from './FileCard';
import { LoadingScreen } from '../ui/Spinner';
import { FolderOpen } from 'lucide-react';

export default function FileList({ files, loading, onDelete }) {
    if (loading) {
        return <LoadingScreen message="Loading files..." />;
    }

    if (!files || files.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mb-4">
                    <FolderOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No files yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Upload your first file to get started</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
                {files.map((file) => (
                    <FileCard
                        key={file.id}
                        file={file}
                        onDelete={onDelete}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
