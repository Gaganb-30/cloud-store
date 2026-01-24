/**
 * Admin Controller
 */
import adminService from '../services/AdminService.js';
import expiryService from '../services/ExpiryService.js';

export async function getUsers(req, res, next) {
    try {
        const { page, limit, role, search } = req.query;
        const result = await adminService.getUsers({
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 20,
            role,
            search,
        });
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function promoteUser(req, res, next) {
    try {
        const { durationMonths } = req.body; // Optional: null = lifetime
        const result = await adminService.promoteUser(req.params.userId, durationMonths);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function demoteUser(req, res, next) {
    try {
        const result = await adminService.demoteUser(req.params.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function setUserQuota(req, res, next) {
    try {
        const result = await adminService.setUserQuota(req.params.userId, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function forceDeleteFile(req, res, next) {
    try {
        const result = await adminService.forceDeleteFile(req.params.fileId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function bulkDeleteFiles(req, res, next) {
    try {
        const { fileIds } = req.body;
        const result = await adminService.bulkDeleteFiles(fileIds);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function forceMigrateFile(req, res, next) {
    try {
        const { tier } = req.body;
        const result = await adminService.forceMigrateFile(req.params.fileId, tier);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function setFileExpiry(req, res, next) {
    try {
        const { expiresAt } = req.body;
        const result = await adminService.setFileExpiry(req.params.fileId, expiresAt);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function getSystemStats(req, res, next) {
    try {
        const result = await adminService.getSystemStats();
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function blockUser(req, res, next) {
    try {
        const result = await adminService.blockUser(req.params.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function restrictUser(req, res, next) {
    try {
        const result = await adminService.restrictUser(req.params.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function unblockUser(req, res, next) {
    try {
        const result = await adminService.unblockUser(req.params.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

// ==================== View-as-User Feature ====================

export async function getUserDashboard(req, res, next) {
    try {
        const result = await adminService.getUserDashboard(req.params.userId);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function getUserFolderContents(req, res, next) {
    try {
        const { page, limit, sort } = req.query;
        const result = await adminService.getUserFolderContents(
            req.params.userId,
            req.params.folderId,
            {
                page: parseInt(page, 10) || 1,
                limit: parseInt(limit, 10) || 50,
                sort,
            }
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function getUserAnalytics(req, res, next) {
    try {
        const { period = '30' } = req.query;
        const result = await adminService.getUserAnalytics(
            req.params.userId,
            parseInt(period, 10) || 30
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
}

// ==================== Cleanup Tools ====================

/**
 * Manually trigger cleanup (expiry + inactivity)
 */
export async function runCleanup(req, res, next) {
    try {
        const { limit = 100 } = req.query;
        const batchSize = parseInt(limit, 10) || 100;

        // Run expiry cleanup
        const expiryResult = await expiryService.processExpiredBatch(batchSize);

        // Run inactivity cleanup
        const inactivityResult = await expiryService.processInactiveBatch(batchSize);

        // Get stats
        const stats = await expiryService.getStats();

        res.json({
            success: true,
            expiry: expiryResult,
            inactivity: inactivityResult,
            stats,
        });
    } catch (error) {
        next(error);
    }
}
