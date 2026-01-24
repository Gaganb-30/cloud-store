/**
 * File Model
 * Stores file metadata and tracking information
 */

import mongoose from 'mongoose';
import { StorageTier } from '../providers/storage/StorageProvider.js';

const fileSchema = new mongoose.Schema({
    // Owner reference
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    // Folder reference (null = root)
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
        index: true,
    },

    // File identification
    storageKey: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    // Original file info
    originalName: {
        type: String,
        required: true,
    },
    mimeType: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        required: true,
    },

    // Integrity
    hash: {
        type: String,
        required: true,
        index: true, // For deduplication queries
    },

    // Storage tier
    storageTier: {
        type: String,
        enum: Object.values(StorageTier),
        default: StorageTier.HOT,
        index: true,
    },

    // Access tracking
    downloads: {
        type: Number,
        default: 0,
        index: true,
    },
    // Unique IPs that downloaded (for anti-abuse threshold)
    uniqueDownloadIPs: {
        type: [String],
        default: [],
    },
    lastDownloadAt: {
        type: Date,
    },
    lastAccessAt: {
        type: Date,
        default: Date.now,
        index: true,
    },

    // Expiry (for free users)
    expiresAt: {
        type: Date,
        index: true,
    },

    // Visibility
    isPublic: {
        type: Boolean,
        default: true,
    },
    password: {
        type: String,
        select: false,
    },

    // Deletion tracking
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    deletedAt: {
        type: Date,
    },

    // Migration tracking
    migrationStatus: {
        type: String,
        enum: ['none', 'pending', 'in_progress', 'completed', 'failed'],
        default: 'none',
    },
    lastMigrationAt: {
        type: Date,
    },

    // Metadata
    metadata: {
        type: Map,
        of: String,
        default: {},
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.password;
            delete ret.__v;
            return ret;
        },
    },
});

// Compound indexes for common queries
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ userId: 1, isDeleted: 1 });
fileSchema.index({ expiresAt: 1, isDeleted: 1 }); // For expiry worker
fileSchema.index({ storageTier: 1, lastAccessAt: 1 }); // For migration worker
fileSchema.index({ downloads: -1, storageTier: 1 }); // For hot file detection

// TTL index for auto-deletion (handled by worker instead for safety)
// fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Virtual: file URL
 */
fileSchema.virtual('downloadUrl').get(function () {
    return `/api/download/${this._id}`;
});

/**
 * Virtual: is expired
 */
fileSchema.virtual('isExpired').get(function () {
    return this.expiresAt && this.expiresAt < new Date();
});

/**
 * Virtual: friendly size
 */
fileSchema.virtual('friendlySize').get(function () {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = this.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
});

/**
 * Increment download count and manage expiry
 * After download threshold (from unique non-owner IPs), expiry is shortened
 * @param {number} extensionDays - Days to extend expiry
 * @param {number} downloadThreshold - Number of unique IP downloads before shortening
 * @param {number} daysAfterThreshold - Days of expiry after threshold reached
 * @param {string} downloaderIp - IP address of downloader
 * @param {string} ownerId - Owner's user ID (to exclude self-downloads)
 */
fileSchema.methods.incrementDownload = async function (extensionDays = 5, downloadThreshold = 5, daysAfterThreshold = 1, downloaderIp = null, ownerId = null) {
    const now = new Date();

    this.downloads += 1;
    this.lastDownloadAt = now;
    this.lastAccessAt = now;

    // Track unique download IP (if provided)
    let isUniqueDownload = false;
    const isOwnerDownload = ownerId && this.userId.toString() === ownerId.toString();

    if (downloaderIp && !isOwnerDownload) {
        // Check if this IP already downloaded
        if (!this.uniqueDownloadIPs.includes(downloaderIp)) {
            this.uniqueDownloadIPs.push(downloaderIp);
            isUniqueDownload = true;
        }
    }

    // Only apply expiry logic if file has an expiry (free users)
    if (this.expiresAt) {
        // Use unique IP count for threshold (excludes owner and duplicate IPs)
        const uniqueCount = this.uniqueDownloadIPs.length;

        // Check if download threshold reached (unique non-owner IPs only)
        if (uniqueCount >= downloadThreshold) {
            // After threshold, set expiry to X days from now (shorter)
            const thresholdExpiry = new Date(now.getTime() + daysAfterThreshold * 24 * 60 * 60 * 1000);

            // Only shorten if current expiry is later
            if (this.expiresAt > thresholdExpiry) {
                this.expiresAt = thresholdExpiry;
            }
        } else {
            // Normal extension logic (before threshold)
            const newExpiry = new Date(now.getTime() + extensionDays * 24 * 60 * 60 * 1000);
            if (newExpiry > this.expiresAt) {
                this.expiresAt = newExpiry;
            }
        }
    }

    await this.save();
};

/**
 * Mark as deleted (soft delete)
 */
fileSchema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
};

/**
 * Update storage tier
 */
fileSchema.methods.updateTier = async function (newTier) {
    this.storageTier = newTier;
    this.lastMigrationAt = new Date();
    this.migrationStatus = 'completed';
    await this.save();
};

/**
 * Static: Find user files
 */
fileSchema.statics.findUserFiles = function (userId, options = {}) {
    const query = this.find({
        userId,
        isDeleted: false,
    });

    if (options.sort) {
        query.sort(options.sort);
    } else {
        query.sort({ createdAt: -1 });
    }

    if (options.limit) {
        query.limit(options.limit);
    }

    if (options.skip) {
        query.skip(options.skip);
    }

    return query;
};

/**
 * Static: Find expired files
 */
fileSchema.statics.findExpiredFiles = function (limit = 100) {
    return this.find({
        expiresAt: { $lte: new Date() },
        isDeleted: false,
    })
        .sort({ expiresAt: 1 })
        .limit(limit);
};

/**
 * Static: Find files eligible for cold migration
 */
fileSchema.statics.findColdMigrationCandidates = function (daysInactive, limit = 100) {
    const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);

    return this.find({
        storageTier: StorageTier.HOT,
        lastAccessAt: { $lte: cutoffDate },
        isDeleted: false,
        migrationStatus: { $nin: ['pending', 'in_progress'] },
    })
        .sort({ lastAccessAt: 1 })
        .limit(limit);
};

/**
 * Static: Find files eligible for hot migration
 */
fileSchema.statics.findHotMigrationCandidates = function (downloadThreshold, limit = 100) {
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    return this.find({
        storageTier: StorageTier.COLD,
        downloads: { $gte: downloadThreshold },
        lastDownloadAt: { $gte: recentDate },
        isDeleted: false,
        migrationStatus: { $nin: ['pending', 'in_progress'] },
    })
        .sort({ downloads: -1 })
        .limit(limit);
};

/**
 * Static: Find inactive files (not downloaded for X days)
 * Applies to ALL users including premium and admin
 */
fileSchema.statics.findInactiveFiles = function (inactivityDays, limit = 100) {
    const cutoffDate = new Date(Date.now() - inactivityDays * 24 * 60 * 60 * 1000);

    return this.find({
        isDeleted: false,
        $or: [
            // Never downloaded and created before cutoff
            { lastDownloadAt: null, createdAt: { $lte: cutoffDate } },
            // Last download was before cutoff
            { lastDownloadAt: { $lte: cutoffDate } },
        ],
    })
        .sort({ lastDownloadAt: 1, createdAt: 1 })
        .limit(limit);
};

/**
 * Static: Get user storage usage
 */
fileSchema.statics.getUserStorageUsage = async function (userId) {
    const result = await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                isDeleted: false,
            },
        },
        {
            $group: {
                _id: '$userId',
                totalSize: { $sum: '$size' },
                fileCount: { $sum: 1 },
            },
        },
    ]);

    return result[0] || { totalSize: 0, fileCount: 0 };
};

/**
 * Static: Find by hash (for deduplication)
 */
fileSchema.statics.findByHash = function (hash) {
    return this.findOne({ hash, isDeleted: false });
};

const File = mongoose.model('File', fileSchema);

export default File;
