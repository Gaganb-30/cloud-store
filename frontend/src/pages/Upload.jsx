/**
 * Upload Page
 * Now with folder selection
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Folder, ChevronRight, Home } from 'lucide-react';
import { foldersApi } from '../api/folders';
import FileUploader from '../components/files/FileUploader';
import toast from 'react-hot-toast';

export default function Upload() {
    const location = useLocation();
    const initialFolderId = location.state?.targetFolderId || null;

    const [targetFolder, setTargetFolder] = useState(null);
    const [breadcrumb, setBreadcrumb] = useState([]);
    const [showFolderPicker, setShowFolderPicker] = useState(false);
    const [folders, setFolders] = useState([]);
    const [pickerPath, setPickerPath] = useState([]);
    const [pickerFolderId, setPickerFolderId] = useState(null);

    useEffect(() => {
        if (initialFolderId) {
            loadFolderInfo(initialFolderId);
        }
    }, [initialFolderId]);

    const loadFolderInfo = async (folderId) => {
        try {
            const data = await foldersApi.getFolderContents(folderId);
            setTargetFolder(data.folder);
            setBreadcrumb(data.breadcrumb);
        } catch (error) {
            console.error('Failed to load folder info');
        }
    };

    const loadPickerFolders = async (folderId = null) => {
        try {
            const data = await foldersApi.getFolderContents(folderId || 'root');
            setFolders(data.folders);
            setPickerPath(data.breadcrumb);
            setPickerFolderId(folderId);
        } catch (error) {
            toast.error('Failed to load folders');
        }
    };

    const openFolderPicker = () => {
        setShowFolderPicker(true);
        loadPickerFolders(targetFolder?.id || null);
    };

    const selectFolder = (folder) => {
        setTargetFolder(folder);
        setBreadcrumb(pickerPath);
        setShowFolderPicker(false);
    };

    const selectRoot = () => {
        setTargetFolder(null);
        setBreadcrumb([]);
        setShowFolderPicker(false);
    };

    return (
        <>
            <Helmet>
                <title>Upload Files - CloudVault</title>
            </Helmet>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold">Upload Files</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Drag and drop files or click to browse. Files up to 10GB supported.
                        </p>
                    </div>

                    {/* Target Folder Selection */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Folder className="w-5 h-5 text-amber-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Upload to:</span>
                                <div className="flex items-center gap-1 font-medium">
                                    <Home className="w-4 h-4" />
                                    <span>Root</span>
                                    {breadcrumb.map((folder) => (
                                        <span key={folder.id} className="flex items-center gap-1">
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                            {folder.name}
                                        </span>
                                    ))}
                                    {targetFolder && (
                                        <span className="flex items-center gap-1">
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                            {targetFolder.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={openFolderPicker}
                                className="text-sm text-accent hover:underline"
                            >
                                Change
                            </button>
                        </div>
                    </div>

                    <FileUploader targetFolderId={targetFolder?.id || null} />

                    {/* Tips */}
                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                            Upload Tips
                        </h3>
                        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                            <li>• Uploads can be resumed if interrupted</li>
                            <li>• Files are uploaded in 10MB chunks for reliability</li>
                            <li>• Large files are stored on SSD for fast access</li>
                            <li>• Free accounts: files expire after 5 days without downloads</li>
                        </ul>
                    </div>
                </motion.div>
            </div>

            {/* Folder Picker Modal */}
            {showFolderPicker && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowFolderPicker(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[70vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                            <h3 className="text-lg font-semibold">Select Upload Folder</h3>

                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1 text-sm mt-2 overflow-x-auto">
                                <button
                                    onClick={() => loadPickerFolders(null)}
                                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"
                                >
                                    <Home className="w-3 h-3" />
                                    Root
                                </button>
                                {pickerPath.map((folder) => (
                                    <div key={folder.id} className="flex items-center">
                                        <ChevronRight className="w-3 h-3 text-gray-400" />
                                        <button
                                            onClick={() => loadPickerFolders(folder.id)}
                                            className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"
                                        >
                                            {folder.name}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
                            {folders.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No subfolders</p>
                            ) : (
                                <div className="space-y-1">
                                    {folders.map((folder) => (
                                        <div
                                            key={folder.id}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 cursor-pointer"
                                            onClick={() => selectFolder(folder)}
                                            onDoubleClick={() => loadPickerFolders(folder.id)}
                                        >
                                            <Folder className="w-5 h-5 text-amber-500" />
                                            <span className="flex-1 truncate">{folder.name}</span>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-dark-700 flex justify-between">
                            <button
                                onClick={selectRoot}
                                className="text-sm text-gray-600 hover:text-gray-900 dark:hover:text-gray-300"
                            >
                                Upload to Root
                            </button>
                            <button
                                onClick={() => setShowFolderPicker(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
}
