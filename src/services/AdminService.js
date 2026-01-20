/**
 * Admin Service
 * Administrative operations for user and file management
 */

import { User, UserRole, File, Quota } from '../models/index.js';
import storageTierService from './StorageTierService.js';
import expiryService from './ExpiryService.js';
import { StorageTier } from '../providers/storage/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class AdminService {
    async getUsers(options = {}) {
        const { page = 1, limit = 20, role, search } = options;
        const skip = (page - 1) * limit;
        const query = {};
        if (role) query.role = role;
        if (search) query.email = { $regex: search, $options: 'i' };

        const [users, total] = await Promise.all([
            User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            User.countDocuments(query),
        ]);

        // Fetch quota info for each user
        const usersWithQuota = await Promise.all(
            users.map(async (user) => {
                const quota = await Quota.findOne({ userId: user._id });
                return {
                    ...user,
                    storageUsed: quota?.usage?.storage || 0,
                    fileCount: quota?.usage?.fileCount || 0,
                };
            })
        );

        return { users: usersWithQuota, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    async promoteUser(userId) {
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('User');
        if (user.role === UserRole.ADMIN) throw new ValidationError('Cannot change admin role');

        user.role = UserRole.PREMIUM;
        await user.save();
        await File.updateMany({ userId, isDeleted: false }, { $unset: { expiresAt: 1 } });
        logger.info('User promoted', { userId });
        return { success: true, user: user.toJSON() };
    }

    async demoteUser(userId) {
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('User');
        if (user.role === UserRole.ADMIN) throw new ValidationError('Cannot change admin role');

        user.role = UserRole.FREE;
        await user.save();
        const expiryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        await File.updateMany({ userId, isDeleted: false, expiresAt: null }, { $set: { expiresAt: expiryDate } });
        logger.info('User demoted', { userId });
        return { success: true, user: user.toJSON() };
    }

    async setUserQuota(userId, limits) {
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('User');

        const quota = await Quota.getOrCreate(userId);
        if (limits.maxStorage !== undefined) quota.limits.maxStorage = limits.maxStorage;
        if (limits.maxFileSize !== undefined) quota.limits.maxFileSize = limits.maxFileSize;
        if (limits.maxFiles !== undefined) quota.limits.maxFiles = limits.maxFiles;
        await quota.save();

        logger.info('Quota updated', { userId, limits });
        return { success: true, quota: await quota.getSummary() };
    }

    async forceDeleteFile(fileId) {
        const file = await File.findById(fileId);
        if (!file) throw new NotFoundError('File');

        const storageProvider = (await import('../providers/storage/index.js')).default;
        await storageProvider.delete(file.storageKey, file.storageTier);
        await file.softDelete();

        const quota = await Quota.getOrCreate(file.userId);
        await quota.removeFile(file.size);

        logger.info('File force deleted', { fileId });
        return { success: true };
    }

    /**
     * Bulk delete files (for DMCA takedowns)
     * Accepts up to 100 file IDs, skips invalid/missing ones
     */
    async bulkDeleteFiles(fileIds) {
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            throw new ValidationError('File IDs array is required');
        }

        if (fileIds.length > 100) {
            throw new ValidationError('Maximum 100 files can be deleted at once');
        }

        const storageProvider = (await import('../providers/storage/index.js')).default;

        const results = {
            deleted: [],
            failed: [],
            skipped: [],
        };

        for (const fileId of fileIds) {
            try {
                // Validate ObjectId format
                if (!fileId || typeof fileId !== 'string' || fileId.length !== 24) {
                    results.skipped.push({ fileId, reason: 'Invalid ID format' });
                    continue;
                }

                const file = await File.findById(fileId);
                if (!file) {
                    results.skipped.push({ fileId, reason: 'File not found' });
                    continue;
                }

                if (file.isDeleted) {
                    results.skipped.push({ fileId, reason: 'Already deleted' });
                    continue;
                }

                // Delete from storage
                try {
                    await storageProvider.delete(file.storageKey, file.storageTier);
                } catch (storageErr) {
                    logger.error('Storage delete failed during bulk delete', { fileId, error: storageErr.message });
                }

                // Update quota
                const quota = await Quota.getOrCreate(file.userId);
                await quota.removeFile(file.size);

                // Soft delete the file record
                await file.softDelete();

                results.deleted.push({
                    fileId,
                    filename: file.originalName,
                    size: file.size,
                    userId: file.userId.toString(),
                });

            } catch (err) {
                results.failed.push({ fileId, reason: err.message });
            }
        }

        logger.info('Bulk delete completed', {
            total: fileIds.length,
            deleted: results.deleted.length,
            failed: results.failed.length,
            skipped: results.skipped.length,
        });

        return results;
    }

    async forceMigrateFile(fileId, targetTier) {
        if (!Object.values(StorageTier).includes(targetTier)) {
            throw new ValidationError(`Invalid tier: ${targetTier}`);
        }
        return storageTierService.forceMigrate(fileId, targetTier);
    }

    async setFileExpiry(fileId, expiresAt) {
        const file = await File.findById(fileId);
        if (!file) throw new NotFoundError('File');

        file.expiresAt = expiresAt ? new Date(expiresAt) : null;
        await file.save();
        logger.info('File expiry set', { fileId, expiresAt: file.expiresAt });
        return { success: true, expiresAt: file.expiresAt };
    }

    async getSystemStats() {
        const [userCounts, fileCount, storageAgg, downloadAgg] = await Promise.all([
            User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
            File.countDocuments({ isDeleted: false }),
            File.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$size' } } }]),
            File.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$downloads' } } }]),
        ]);

        const usersByRole = Object.fromEntries(userCounts.map(u => [u._id, u.count]));
        const totalUsers = userCounts.reduce((acc, u) => acc + u.count, 0);

        return {
            users: {
                total: totalUsers,
                free: usersByRole.free || 0,
                premium: usersByRole.premium || 0,
                admin: usersByRole.admin || 0,
            },
            files: {
                total: fileCount,
            },
            storage: {
                used: storageAgg[0]?.total || 0,
            },
            downloads: {
                total: downloadAgg[0]?.total || 0,
            },
        };
    }

    /**
     * Block user - deactivate account and delete all files permanently
     */
    async blockUser(userId) {
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('User');
        if (user.role === UserRole.ADMIN) throw new ValidationError('Cannot block admin users');

        // Get storage provider
        const storageProvider = (await import('../providers/storage/index.js')).default;

        // Find and delete all user files from storage
        const files = await File.find({ userId, isDeleted: false });
        let deletedCount = 0;
        let freedSpace = 0;

        for (const file of files) {
            try {
                await storageProvider.delete(file.storageKey, file.storageTier);
                freedSpace += file.size;
                deletedCount++;
            } catch (err) {
                logger.error('Failed to delete file during block', { fileId: file._id, error: err.message });
            }
        }

        // Hard delete all file records
        await File.deleteMany({ userId });

        // Reset quota
        const quota = await Quota.findOne({ userId });
        if (quota) {
            quota.usage.storage = 0;
            quota.usage.fileCount = 0;
            await quota.save();
        }

        // Update user status
        const { UserStatus } = await import('../models/index.js');
        user.status = UserStatus.BLOCKED;
        user.isActive = false;
        await user.removeAllRefreshTokens();
        await user.save();

        logger.info('User blocked', { userId, deletedFiles: deletedCount, freedSpace });
        return {
            success: true,
            user: user.toJSON(),
            deletedFiles: deletedCount,
            freedSpace,
        };
    }

    /**
     * Restrict user - disable uploads but keep files accessible
     */
    async restrictUser(userId) {
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('User');
        if (user.role === UserRole.ADMIN) throw new ValidationError('Cannot restrict admin users');

        const { UserStatus } = await import('../models/index.js');
        user.status = UserStatus.RESTRICTED;
        await user.save();

        logger.info('User restricted', { userId });
        return { success: true, user: user.toJSON() };
    }

    /**
     * Unblock/Unrestrict user - restore to active status
     */
    async unblockUser(userId) {
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError('User');

        const { UserStatus } = await import('../models/index.js');
        user.status = UserStatus.ACTIVE;
        user.isActive = true;
        await user.save();

        logger.info('User unblocked', { userId });
        return { success: true, user: user.toJSON() };
    }
}

const adminService = new AdminService();
export default adminService;
