/**
 * Admin Documentation Page
 * Comprehensive API documentation for administrators
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
    Book, Code, Server, Database, Shield, Upload, Download, Users,
    FolderTree, BarChart3, ChevronDown, ChevronUp, ArrowRight,
    Lock, RefreshCw, Trash2, Eye, Zap, Clock, Settings
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Collapsible Section Component
function Section({ title, icon: Icon, children, defaultOpen = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 dark:border-dark-600 rounded-xl overflow-hidden mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-5 h-5 text-accent" />}
                    <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 py-4 bg-gray-50 dark:bg-dark-800 border-t border-gray-200 dark:border-dark-600">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// API Endpoint Component
function Endpoint({ method, path, description, auth, body, response }) {
    const methodColors = {
        GET: 'bg-green-500',
        POST: 'bg-blue-500',
        PUT: 'bg-yellow-500',
        PATCH: 'bg-orange-500',
        DELETE: 'bg-red-500'
    };

    return (
        <div className="border border-gray-200 dark:border-dark-600 rounded-lg p-4 mb-3 bg-white dark:bg-dark-700">
            <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 text-xs font-bold text-white rounded ${methodColors[method]}`}>
                    {method}
                </span>
                <code className="text-sm text-accent font-mono">{path}</code>
                {auth && (
                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Auth
                    </span>
                )}
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{description}</p>
            {body && (
                <div className="mt-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Body:</span>
                    <code className="block text-xs bg-gray-100 dark:bg-dark-800 p-2 rounded mt-1 text-gray-600 dark:text-gray-300 overflow-x-auto">
                        {body}
                    </code>
                </div>
            )}
            {response && (
                <div className="mt-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Response:</span>
                    <code className="block text-xs bg-gray-100 dark:bg-dark-800 p-2 rounded mt-1 text-gray-600 dark:text-gray-300 overflow-x-auto">
                        {response}
                    </code>
                </div>
            )}
        </div>
    );
}

// Flow Diagram Component using ASCII/Box style
function FlowDiagram({ title, steps }) {
    return (
        <div className="bg-gray-900 rounded-xl p-6 mb-6 overflow-x-auto">
            <h4 className="text-white font-semibold mb-4">{title}</h4>
            <div className="flex items-center gap-2 flex-wrap">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="px-4 py-2 bg-gradient-to-r from-accent/20 to-purple-500/20 border border-accent/40 rounded-lg"
                        >
                            <span className="text-xs text-gray-400">Step {index + 1}</span>
                            <p className="text-sm text-white font-medium">{step}</p>
                        </motion.div>
                        {index < steps.length - 1 && (
                            <ArrowRight className="w-5 h-5 text-accent" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Architecture Diagram
function ArchitectureDiagram() {
    return (
        <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <h4 className="text-white font-semibold mb-6 text-center">System Architecture</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Frontend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
                >
                    <h5 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Frontend
                    </h5>
                    <ul className="text-sm text-gray-300 space-y-1">
                        <li>• React + Vite</li>
                        <li>• TailwindCSS</li>
                        <li>• Framer Motion</li>
                        <li>• React Router</li>
                        <li>• Context API</li>
                    </ul>
                </motion.div>

                {/* Backend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-green-500/10 border border-green-500/30 rounded-xl p-4"
                >
                    <h5 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                        <Server className="w-4 h-4" /> Backend
                    </h5>
                    <ul className="text-sm text-gray-300 space-y-1">
                        <li>• Node.js + Express</li>
                        <li>• JWT Authentication</li>
                        <li>• Rate Limiting</li>
                        <li>• Chunked Uploads</li>
                        <li>• Background Workers</li>
                    </ul>
                </motion.div>

                {/* Storage */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4"
                >
                    <h5 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                        <Database className="w-4 h-4" /> Storage
                    </h5>
                    <ul className="text-sm text-gray-300 space-y-1">
                        <li>• MongoDB (metadata)</li>
                        <li>• Redis (cache/sessions)</li>
                        <li>• Cloudflare R2 (files)</li>
                        <li>• Hot/Cold Tiering</li>
                        <li>• Presigned URLs</li>
                    </ul>
                </motion.div>
            </div>

            {/* Connection arrows */}
            <div className="flex items-center justify-center gap-4 mt-4">
                <span className="text-gray-500 text-sm">User</span>
                <ArrowRight className="w-4 h-4 text-gray-500" />
                <span className="text-blue-400 text-sm">Frontend</span>
                <ArrowRight className="w-4 h-4 text-gray-500" />
                <span className="text-green-400 text-sm">Backend API</span>
                <ArrowRight className="w-4 h-4 text-gray-500" />
                <span className="text-purple-400 text-sm">R2 Storage</span>
            </div>
        </div>
    );
}

export default function AdminDocs() {
    const { isAdmin, loading } = useAuth();

    // Redirect non-admins
    if (!loading && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-dark-900 dark:to-dark-800"
        >
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-dark-700 bg-gradient-to-r from-accent/10 to-purple-500/10">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
                                <Book className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Documentation</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Complete API & System Reference</p>
                            </div>
                        </div>
                        <Link
                            to="/admin"
                            className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            ← Back to Admin
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-dark-700 rounded-xl p-4 border border-gray-200 dark:border-dark-600 text-center">
                        <Code className="w-6 h-6 text-accent mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">40+</p>
                        <p className="text-xs text-gray-500">API Endpoints</p>
                    </div>
                    <div className="bg-white dark:bg-dark-700 rounded-xl p-4 border border-gray-200 dark:border-dark-600 text-center">
                        <Server className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
                        <p className="text-xs text-gray-500">Route Modules</p>
                    </div>
                    <div className="bg-white dark:bg-dark-700 rounded-xl p-4 border border-gray-200 dark:border-dark-600 text-center">
                        <Database className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">6</p>
                        <p className="text-xs text-gray-500">DB Models</p>
                    </div>
                    <div className="bg-white dark:bg-dark-700 rounded-xl p-4 border border-gray-200 dark:border-dark-600 text-center">
                        <RefreshCw className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
                        <p className="text-xs text-gray-500">Background Workers</p>
                    </div>
                </div>

                {/* Architecture Overview */}
                <Section title="System Architecture Overview" icon={Settings} defaultOpen={true}>
                    <ArchitectureDiagram />

                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Key Technologies</h5>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                <li>• <strong>Express.js</strong> - REST API framework</li>
                                <li>• <strong>MongoDB</strong> - Document database for metadata</li>
                                <li>• <strong>Redis</strong> - Session cache & rate limiting</li>
                                <li>• <strong>Cloudflare R2</strong> - S3-compatible file storage</li>
                                <li>• <strong>JWT</strong> - Stateless authentication</li>
                            </ul>
                        </div>
                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Security Features</h5>
                            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                <li>• JWT with refresh tokens</li>
                                <li>• Rate limiting per user/IP</li>
                                <li>• File type validation</li>
                                <li>• Presigned URLs for direct uploads</li>
                                <li>• Abuse detection & auto-blocking</li>
                            </ul>
                        </div>
                    </div>
                </Section>

                {/* Authentication Routes */}
                <Section title="🔐 Authentication Routes (/api/auth)" icon={Shield}>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Handles user registration, login, password management, and session handling.
                    </p>

                    <FlowDiagram
                        title="Registration Flow (2-Step Email Verification)"
                        steps={[
                            "User enters email/password",
                            "POST /initiate-register",
                            "OTP sent to email",
                            "User enters OTP",
                            "POST /complete-register",
                            "Account created + JWT issued"
                        ]}
                    />

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Endpoints:</h4>

                    <Endpoint method="POST" path="/api/auth/initiate-register"
                        description="Start registration - sends OTP to email"
                        body='{ "email": "user@example.com", "username": "user", "password": "..." }'
                        response='{ "message": "OTP sent", "email": "u***@example.com" }'
                    />
                    <Endpoint method="POST" path="/api/auth/complete-register"
                        description="Complete registration with OTP verification"
                        body='{ "email": "user@example.com", "otp": "123456" }'
                        response='{ "user": {...}, "accessToken": "...", "refreshToken": "..." }'
                    />
                    <Endpoint method="POST" path="/api/auth/login"
                        description="Login with email/password"
                        body='{ "email": "...", "password": "..." }'
                        response='{ "user": {...}, "accessToken": "...", "refreshToken": "..." }'
                    />
                    <Endpoint method="POST" path="/api/auth/refresh"
                        description="Get new access token using refresh token"
                        body='{ "refreshToken": "..." }'
                        response='{ "accessToken": "..." }'
                    />
                    <Endpoint method="POST" path="/api/auth/logout" auth
                        description="Invalidate refresh token"
                    />
                    <Endpoint method="GET" path="/api/auth/me" auth
                        description="Get current user info + quota"
                        response='{ "user": {...}, "quota": {...} }'
                    />
                    <Endpoint method="POST" path="/api/auth/change-password" auth
                        description="Change password (requires current password)"
                        body='{ "currentPassword": "...", "newPassword": "..." }'
                    />
                    <Endpoint method="POST" path="/api/auth/forgot-password"
                        description="Request password reset OTP"
                        body='{ "email": "..." }'
                    />
                    <Endpoint method="POST" path="/api/auth/verify-otp"
                        description="Verify reset OTP"
                        body='{ "email": "...", "otp": "123456" }'
                    />
                    <Endpoint method="POST" path="/api/auth/reset-password"
                        description="Set new password after OTP verification"
                        body='{ "email": "...", "otp": "123456", "newPassword": "..." }'
                    />
                </Section>

                {/* Upload Routes */}
                <Section title="📤 Upload Routes (/api/upload)" icon={Upload}>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Handles chunked file uploads through the backend (proxied) or direct to R2 (presigned URLs).
                    </p>

                    <FlowDiagram
                        title="R2 Direct Upload Flow (Recommended - Faster)"
                        steps={[
                            "POST /r2/init",
                            "Get presigned URLs",
                            "PUT chunks to R2 (parallel)",
                            "POST /r2/complete",
                            "File record created"
                        ]}
                    />

                    <FlowDiagram
                        title="Proxied Upload Flow (Fallback)"
                        steps={[
                            "POST /init",
                            "Get sessionId",
                            "PUT /chunk/:id/:index (each chunk)",
                            "POST /complete/:id",
                            "File saved to R2"
                        ]}
                    />

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 mt-6">Proxied Upload Endpoints:</h4>

                    <Endpoint method="POST" path="/api/upload/init" auth
                        description="Initialize chunked upload session"
                        body='{ "filename": "file.zip", "size": 1073741824, "mimeType": "application/zip" }'
                        response='{ "sessionId": "...", "chunkSize": 26214400, "totalChunks": 41 }'
                    />
                    <Endpoint method="PUT" path="/api/upload/chunk/:sessionId/:chunkIndex" auth
                        description="Upload a single chunk (raw binary body)"
                        body="[Binary chunk data]"
                    />
                    <Endpoint method="GET" path="/api/upload/status/:sessionId" auth
                        description="Get upload progress"
                        response='{ "uploadedChunks": 10, "totalChunks": 41, "progress": 24 }'
                    />
                    <Endpoint method="GET" path="/api/upload/resume/:sessionId" auth
                        description="Get missing chunks to resume upload"
                        response='{ "missingChunks": [5, 12, 33] }'
                    />
                    <Endpoint method="POST" path="/api/upload/complete/:sessionId" auth
                        description="Complete upload and create file record"
                        response='{ "file": {...}, "downloadUrl": "/api/download/:fileId" }'
                    />
                    <Endpoint method="DELETE" path="/api/upload/abort/:sessionId" auth
                        description="Cancel upload and cleanup"
                    />

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 mt-6">R2 Direct Upload Endpoints:</h4>

                    <Endpoint method="GET" path="/api/upload/storage-info"
                        description="Check if R2 direct upload is available"
                        response='{ "supportsDirectUpload": true, "provider": "r2" }'
                    />
                    <Endpoint method="POST" path="/api/upload/r2/init" auth
                        description="Initialize R2 multipart upload with presigned URLs"
                        body='{ "filename": "file.zip", "size": 1073741824 }'
                        response='{ "sessionId": "...", "presignedUrls": [...], "partSize": 26214400 }'
                    />
                    <Endpoint method="POST" path="/api/upload/r2/complete/:sessionId" auth
                        description="Complete R2 multipart upload"
                        body='{ "etags": ["etag1", "etag2", ...] }'
                        response='{ "file": {...}, "downloadUrl": "..." }'
                    />
                    <Endpoint method="DELETE" path="/api/upload/r2/abort/:sessionId" auth
                        description="Abort R2 multipart upload"
                    />
                </Section>

                {/* Download/Files Routes */}
                <Section title="📥 Files & Download Routes (/api/files, /api/download)" icon={Download}>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Handles file listing, downloads, deletion, and file management.
                    </p>

                    <FlowDiagram
                        title="Download Flow"
                        steps={[
                            "GET /info/:fileId",
                            "Check permissions",
                            "GET /:fileId (stream)",
                            "Update lastAccessAt",
                            "Increment downloads"
                        ]}
                    />

                    <Endpoint method="GET" path="/api/files" auth
                        description="List all files for current user"
                        response='{ "files": [...], "total": 42, "page": 1 }'
                    />
                    <Endpoint method="GET" path="/api/files/info/:fileId"
                        description="Get file metadata (public if file is public)"
                        response='{ "file": { "id": "...", "name": "...", "size": 1024, "downloads": 5 } }'
                    />
                    <Endpoint method="GET" path="/api/download/:fileId"
                        description="Download file (streams binary data)"
                        response="[Binary file data with Content-Disposition header]"
                    />
                    <Endpoint method="DELETE" path="/api/files/:fileId" auth
                        description="Delete file (owner or admin only)"
                    />
                    <Endpoint method="PATCH" path="/api/files/:fileId/rename" auth
                        description="Rename file"
                        body='{ "name": "new-name.zip" }'
                    />
                </Section>

                {/* Folder Routes */}
                <Section title="📁 Folder Routes (/api/folders)" icon={FolderTree}>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Handles folder creation, listing, and file organization.
                    </p>

                    <Endpoint method="POST" path="/api/folders" auth
                        description="Create new folder"
                        body='{ "name": "My Folder", "parentId": null }'
                    />
                    <Endpoint method="GET" path="/api/folders" auth
                        description="List folders (optional: parentId query)"
                        response='{ "folders": [...] }'
                    />
                    <Endpoint method="GET" path="/api/folders/:folderId" auth
                        description="Get folder info"
                    />
                    <Endpoint method="GET" path="/api/folders/:folderId/contents" auth
                        description="Get folder contents (files + subfolders)"
                        response='{ "folder": {...}, "files": [...], "subfolders": [...] }'
                    />
                    <Endpoint method="PATCH" path="/api/folders/:folderId" auth
                        description="Rename folder"
                        body='{ "name": "New Name" }'
                    />
                    <Endpoint method="POST" path="/api/folders/:folderId/move" auth
                        description="Move folder to new parent"
                        body='{ "newParentId": "..." }'
                    />
                    <Endpoint method="DELETE" path="/api/folders/:folderId" auth
                        description="Delete folder (and contents)"
                    />
                    <Endpoint method="POST" path="/api/folders/files/:fileId/move" auth
                        description="Move file to folder"
                        body='{ "folderId": "..." }'
                    />
                </Section>

                {/* Admin Routes */}
                <Section title="👑 Admin Routes (/api/admin)" icon={Users}>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Admin-only endpoints for system management, user control, and file moderation.
                    </p>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-400 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> All admin routes require admin role authentication
                        </p>
                    </div>

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">System Stats:</h4>
                    <Endpoint method="GET" path="/api/admin/stats" auth
                        description="Get system-wide statistics"
                        response='{ "users": { "total": 100 }, "files": { "total": 5000, "totalSize": "..." }, "storage": {...} }'
                    />

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 mt-4">User Management:</h4>
                    <Endpoint method="GET" path="/api/admin/users" auth
                        description="List all users with filters"
                        response='{ "users": [...], "total": 100, "page": 1 }'
                    />
                    <Endpoint method="POST" path="/api/admin/users/:userId/promote" auth
                        description="Promote user to premium"
                    />
                    <Endpoint method="POST" path="/api/admin/users/:userId/demote" auth
                        description="Demote premium user to free"
                    />
                    <Endpoint method="POST" path="/api/admin/users/:userId/block" auth
                        description="Block user account"
                    />
                    <Endpoint method="POST" path="/api/admin/users/:userId/unblock" auth
                        description="Unblock user account"
                    />
                    <Endpoint method="PUT" path="/api/admin/users/:userId/quota" auth
                        description="Set custom quota limits for user"
                        body='{ "maxStorage": 107374182400, "maxFileSize": -1 }'
                    />
                    <Endpoint method="GET" path="/api/admin/users/:userId/dashboard" auth
                        description="View user's dashboard as admin"
                    />
                    <Endpoint method="GET" path="/api/admin/users/:userId/analytics" auth
                        description="Get user's analytics data"
                    />

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 mt-4">File Management:</h4>
                    <Endpoint method="DELETE" path="/api/admin/files/:fileId" auth
                        description="Force delete any file"
                    />
                    <Endpoint method="POST" path="/api/admin/files/bulk-delete" auth
                        description="Bulk delete multiple files"
                        body='{ "fileIds": ["id1", "id2", ...] }'
                    />
                    <Endpoint method="POST" path="/api/admin/files/:fileId/migrate" auth
                        description="Force migrate file between storage tiers"
                    />
                    <Endpoint method="PUT" path="/api/admin/files/:fileId/expiry" auth
                        description="Set file expiry date"
                        body='{ "expiresAt": "2025-12-31T00:00:00Z" }'
                    />

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 mt-4">Maintenance:</h4>
                    <Endpoint method="POST" path="/api/admin/cleanup/run" auth
                        description="Manually trigger expired file cleanup"
                        response='{ "expiredDeleted": 5, "inactiveDeleted": 2 }'
                    />
                </Section>

                {/* Analytics Routes */}
                <Section title="📊 Analytics Routes (/api/analytics)" icon={BarChart3}>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        User analytics and usage statistics.
                    </p>

                    <Endpoint method="GET" path="/api/analytics" auth
                        description="Get current user's analytics"
                        response='{ "totalFiles": 42, "totalDownloads": 1234, "storageUsed": "2.5 GB", "recentActivity": [...] }'
                    />
                </Section>

                {/* Background Workers */}
                <Section title="⚙️ Background Workers" icon={RefreshCw}>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Automated tasks running in the background.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Trash2 className="w-5 h-5 text-red-400" />
                                <h5 className="font-semibold text-gray-900 dark:text-white">Expiry Worker</h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                Deletes expired files for free users (5 days) and inactive files (90 days).
                            </p>
                            <p className="text-xs text-gray-500">Runs: Every hour</p>
                        </div>

                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                <h5 className="font-semibold text-gray-900 dark:text-white">Migration Worker</h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                Moves files between hot/cold storage tiers based on access patterns.
                            </p>
                            <p className="text-xs text-gray-500">Runs: Every 2 hours</p>
                        </div>

                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-5 h-5 text-blue-400" />
                                <h5 className="font-semibold text-gray-900 dark:text-white">Session Cleanup</h5>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                Removes stale upload sessions and orphaned chunks.
                            </p>
                            <p className="text-xs text-gray-500">Runs: Every 30 minutes</p>
                        </div>
                    </div>
                </Section>

                {/* Database Models */}
                <Section title="🗄️ Database Models" icon={Database}>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        MongoDB collections and their schemas.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">User</h5>
                            <code className="text-xs text-gray-600 dark:text-gray-300 block">
                                {`{ _id, email, username, password, role, status, createdAt }`}
                            </code>
                        </div>
                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">File</h5>
                            <code className="text-xs text-gray-600 dark:text-gray-300 block">
                                {`{ _id, userId, name, size, mimeType, storageKey, storageTier, downloads, expiresAt, lastAccessAt }`}
                            </code>
                        </div>
                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Folder</h5>
                            <code className="text-xs text-gray-600 dark:text-gray-300 block">
                                {`{ _id, userId, name, parentId, path, createdAt }`}
                            </code>
                        </div>
                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Quota</h5>
                            <code className="text-xs text-gray-600 dark:text-gray-300 block">
                                {`{ _id, userId, maxStorage, maxFileSize, maxFiles, usage: { storage, files } }`}
                            </code>
                        </div>
                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">UploadSession</h5>
                            <code className="text-xs text-gray-600 dark:text-gray-300 block">
                                {`{ _id, userId, filename, totalChunks, uploadedChunks, expiresAt, storageKey }`}
                            </code>
                        </div>
                        <div className="bg-gray-100 dark:bg-dark-700 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">RefreshToken</h5>
                            <code className="text-xs text-gray-600 dark:text-gray-300 block">
                                {`{ _id, userId, token, expiresAt, deviceInfo }`}
                            </code>
                        </div>
                    </div>
                </Section>

                {/* Environment Variables */}
                <Section title="🔧 Environment Configuration" icon={Settings}>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Key environment variables that control system behavior.
                    </p>

                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-xs text-gray-300">
                            {`# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/cloudvault
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Storage (R2)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=cloudvault
R2_PUBLIC_URL=https://storage.yourdomain.com

# Limits
UPLOAD_MAX_FILE_SIZE_FREE=10737418240  # 10GB
UPLOAD_CHUNK_SIZE=26214400             # 25MB

# File Expiry
FILE_EXPIRY_DAYS_FREE=5
FILE_EXPIRY_DAYS_AFTER_THRESHOLD=1
FILE_INACTIVITY_DAYS=90`}
                        </pre>
                    </div>
                </Section>

                {/* Back to Admin */}
                <div className="text-center pt-8 border-t border-gray-200 dark:border-dark-700">
                    <Link to="/admin" className="text-accent hover:underline">
                        ← Back to Admin Dashboard
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
