/**
 * FolderBrowser Component
 * Navigate folders and files with breadcrumb
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Folder,
    FolderPlus,
    ChevronRight,
    Home,
    MoreVertical,
    Pencil,
    Trash2,
    FolderInput,
    File,
    Download,
    Share2,
    X,
    Check,
    Loader2
} from 'lucide-react';
import { foldersApi } from '../../api/folders';
import { filesApi } from '../../api/files';
import { formatBytes, formatRelativeTime } from '../../utils/helpers';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

export default function FolderBrowser({ onFileSelect, onUploadHere }) {
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [contents, setContents] = useState({ folders: [], files: [], breadcrumb: [] });
    const [loading, setLoading] = useState(true);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creating, setCreating] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [renaming, setRenaming] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [showMoveModal, setShowMoveModal] = useState(null);

    const loadContents = useCallback(async () => {
        setLoading(true);
        try {
            const data = await foldersApi.getFolderContents(currentFolderId || 'root');
            setContents(data);
        } catch (error) {
            toast.error('Failed to load folder contents');
        } finally {
            setLoading(false);
        }
    }, [currentFolderId]);

    useEffect(() => {
        loadContents();
    }, [loadContents]);

    const navigateToFolder = (folderId) => {
        setCurrentFolderId(folderId);
        setContextMenu(null);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        setCreating(true);
        try {
            await foldersApi.createFolder(newFolderName.trim(), currentFolderId);
            toast.success('Folder created');
            setNewFolderName('');
            setShowCreateFolder(false);
            loadContents();
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to create folder');
        } finally {
            setCreating(false);
        }
    };

    const handleRename = async (item) => {
        if (!renameValue.trim()) return;

        try {
            if (item.type === 'folder') {
                await foldersApi.renameFolder(item.id, renameValue.trim());
            } else {
                await filesApi.renameFile(item.id, renameValue.trim());
            }
            toast.success('Renamed successfully');
            setRenaming(null);
            loadContents();
        } catch (error) {
            toast.error('Failed to rename');
        }
    };

    const handleDelete = async (item) => {
        const confirmMsg = item.type === 'folder'
            ? 'Delete this folder? All subfolders and files inside will also be deleted.'
            : 'Delete this file?';

        if (!confirm(confirmMsg)) return;

        try {
            if (item.type === 'folder') {
                await foldersApi.deleteFolder(item.id);
            } else {
                await filesApi.deleteFile(item.id);
            }
            toast.success('Deleted successfully');
            loadContents();
        } catch (error) {
            toast.error('Failed to delete');
        }
        setContextMenu(null);
    };

    const handleMove = async (item, targetFolderId) => {
        try {
            if (item.type === 'folder') {
                await foldersApi.moveFolder(item.id, targetFolderId);
            } else {
                await foldersApi.moveFile(item.id, targetFolderId);
            }
            toast.success('Moved successfully');
            setShowMoveModal(null);
            loadContents();
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Failed to move');
        }
    };

    const handleShare = (file) => {
        const shareUrl = `${window.location.origin}/d/${file.id}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            toast.success('Share link copied to clipboard!');
        }).catch(() => {
            toast.error('Failed to copy link');
        });
    };

    const getFileIcon = (mimeType) => {
        return <File className="w-5 h-5 text-gray-400" />;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1 text-sm overflow-x-auto">
                    <button
                        onClick={() => navigateToFolder(null)}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"
                    >
                        <Home className="w-4 h-4" />
                        <span>Root</span>
                    </button>
                    {contents.breadcrumb.map((folder, index) => (
                        <div key={folder.id} className="flex items-center">
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <button
                                onClick={() => navigateToFolder(folder.id)}
                                className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 truncate max-w-[150px]"
                            >
                                {folder.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        icon={FolderPlus}
                        onClick={() => setShowCreateFolder(true)}
                    >
                        New Folder
                    </Button>
                    {onUploadHere && (
                        <Button size="sm" onClick={() => onUploadHere(currentFolderId)}>
                            Upload Here
                        </Button>
                    )}
                </div>
            </div>

            {/* Create Folder Input */}
            <AnimatePresence>
                {showCreateFolder && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2"
                    >
                        <Folder className="w-5 h-5 text-accent" />
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                            placeholder="Folder name..."
                            className="input flex-1"
                            autoFocus
                        />
                        <Button
                            size="sm"
                            onClick={handleCreateFolder}
                            loading={creating}
                            icon={Check}
                        />
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                            icon={X}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contents */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
            ) : (
                <div className="space-y-1">
                    {/* Folders */}
                    {contents.folders.map((folder) => (
                        <motion.div
                            key={folder.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer"
                            onClick={() => !renaming && navigateToFolder(folder.id)}
                        >
                            <Folder className="w-5 h-5 text-amber-500" />

                            {renaming?.id === folder.id ? (
                                <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRename(folder)}
                                        className="input flex-1"
                                        autoFocus
                                    />
                                    <button onClick={() => handleRename(folder)} className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded">
                                        <Check className="w-4 h-4 text-green-500" />
                                    </button>
                                    <button onClick={() => setRenaming(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="flex-1 font-medium truncate">{folder.name}</span>
                                    <span className="text-sm text-gray-500 hidden sm:block">
                                        {formatRelativeTime(folder.createdAt)}
                                    </span>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => { setRenaming(folder); setRenameValue(folder.name); }}
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-600 rounded"
                                            title="Rename"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setShowMoveModal(folder)}
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-600 rounded"
                                            title="Move"
                                        >
                                            <FolderInput className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(folder)}
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))}

                    {/* Files */}
                    {contents.files.map((file) => (
                        <motion.div
                            key={file.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-800"
                        >
                            {getFileIcon(file.mimeType)}

                            {renaming?.id === file.id ? (
                                <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRename(file)}
                                        className="input flex-1"
                                        autoFocus
                                    />
                                    <button onClick={() => handleRename(file)} className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded">
                                        <Check className="w-4 h-4 text-green-500" />
                                    </button>
                                    <button onClick={() => setRenaming(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{file.filename}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatBytes(file.size)} • {file.downloads} downloads
                                        </p>
                                    </div>
                                    <span className="text-sm text-gray-500 hidden sm:block">
                                        {formatRelativeTime(file.createdAt)}
                                    </span>
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                        <a
                                            href={file.downloadUrl}
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-600 rounded"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => handleShare(file)}
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-600 rounded"
                                            title="Copy share link"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setRenaming(file); setRenameValue(file.filename); }}
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-600 rounded"
                                            title="Rename"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setShowMoveModal(file)}
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-600 rounded"
                                            title="Move"
                                        >
                                            <FolderInput className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file)}
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))}

                    {/* Empty state */}
                    {contents.folders.length === 0 && contents.files.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>This folder is empty</p>
                            <p className="text-sm mt-1">Create a folder or upload files to get started</p>
                        </div>
                    )}
                </div>
            )}

            {/* Move Modal */}
            <AnimatePresence>
                {showMoveModal && (
                    <MoveModal
                        item={showMoveModal}
                        currentFolderId={currentFolderId}
                        onMove={handleMove}
                        onClose={() => setShowMoveModal(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Move Modal Component
function MoveModal({ item, currentFolderId, onMove, onClose }) {
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [browsePath, setBrowsePath] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadFolders = useCallback(async (parentId) => {
        setLoading(true);
        try {
            const data = await foldersApi.getFolderContents(parentId || 'root');
            setFolders(data.folders.filter(f => f.id !== item.id));
            setBrowsePath(data.breadcrumb);
        } catch (error) {
            toast.error('Failed to load folders');
        } finally {
            setLoading(false);
        }
    }, [item.id]);

    useEffect(() => {
        loadFolders(null);
    }, [loadFolders]);

    const navigateTo = (folderId) => {
        setSelectedFolder(folderId);
        loadFolders(folderId);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                    <h3 className="text-lg font-semibold">Move "{item.name || item.filename}"</h3>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 text-sm mt-2 overflow-x-auto">
                        <button
                            onClick={() => navigateTo(null)}
                            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"
                        >
                            <Home className="w-3 h-3" />
                            Root
                        </button>
                        {browsePath.map((folder) => (
                            <div key={folder.id} className="flex items-center">
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                                <button
                                    onClick={() => navigateTo(folder.id)}
                                    className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"
                                >
                                    {folder.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {folders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selectedFolder === folder.id
                                        ? 'bg-accent/10 text-accent'
                                        : 'hover:bg-gray-100 dark:hover:bg-dark-700'
                                        }`}
                                    onClick={() => setSelectedFolder(folder.id)}
                                    onDoubleClick={() => navigateTo(folder.id)}
                                >
                                    <Folder className="w-5 h-5 text-amber-500" />
                                    <span className="flex-1 truncate">{folder.name}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                            ))}
                            {folders.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No subfolders</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onMove(item, selectedFolder)}>
                        Move Here
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
