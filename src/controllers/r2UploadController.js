/**
 * R2 Upload Controller
 * Handles presigned URL generation for direct R2 uploads
 */

import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import { UploadSession, Quota } from '../models/index.js';
import storageProvider from '../providers/storage/index.js';
import { sanitizeFilename, validateFileType } from '../middleware/security.js';
import { getMimeType } from '../utils/stream.js';
import { ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Initialize R2 multipart upload and return presigned URLs
 */
export async function initR2Upload(req, res, next) {
    try {
        const { filename, size, mimeType, folderId } = req.body;
        const userId = req.user._id;

        // Validate
        const sanitizedFilename = sanitizeFilename(filename);
        const detectedMimeType = mimeType || getMimeType(sanitizedFilename);
        validateFileType(detectedMimeType, sanitizedFilename);

        // Check quota
        const quota = await Quota.getOrCreate(userId);
        const canUpload = await quota.canUpload(size);
        if (!canUpload.allowed) {
            throw new ValidationError(canUpload.reasons[0].message);
        }

        // Generate storage key
        const fileId = uuidv4();
        const storageKey = `${userId}/${fileId}/${sanitizedFilename}`;

        // Calculate parts (R2 minimum part size is 5MB, except last part)
        // Using 25MB parts for better parallelization (4 parallel = 100MB/batch)
        const partSize = 25 * 1024 * 1024; // 25MB parts for maximum parallel speed
        const totalParts = Math.ceil(size / partSize);

        // Initialize multipart upload in R2
        const { uploadId, key } = await storageProvider.initMultipartUpload(storageKey);

        // Generate presigned URLs for each part
        const presignedUrls = [];
        for (let i = 1; i <= totalParts; i++) {
            const partUrl = await storageProvider.getPartUploadUrl(
                key,
                uploadId,
                i,
                config.r2.presignedExpiry
            );
            presignedUrls.push(partUrl);
        }

        // Create session in MongoDB
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + config.r2.presignedExpiry * 1000);

        await UploadSession.create({
            sessionId,
            userId,
            filename: sanitizedFilename,
            originalName: sanitizedFilename,
            mimeType: detectedMimeType,
            totalSize: size,
            chunkSize: partSize,
            totalChunks: totalParts,
            storageKey,
            folderId: folderId || null,
            r2UploadId: uploadId,
            r2Key: key,
            status: 'uploading',
            expiresAt,
        });

        logger.info('R2 multipart upload initialized', {
            sessionId,
            uploadId,
            totalParts,
            size,
        });

        res.status(201).json({
            sessionId,
            uploadId,
            key,
            totalParts,
            partSize,
            presignedUrls,
            expiresIn: config.r2.presignedExpiry,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Complete R2 multipart upload
 */
export async function completeR2Upload(req, res, next) {
    try {
        const { sessionId } = req.params;
        const { parts } = req.body; // Array of ETags from each part upload
        const userId = req.user._id;

        // Find session
        const session = await UploadSession.findOne({ sessionId, userId });
        if (!session) {
            throw new ValidationError('Upload session not found');
        }

        // Complete multipart upload in R2
        await storageProvider.completeMultipartUpload(
            session.r2Key,
            session.r2UploadId,
            parts
        );

        // Get file metadata from R2 (optional, may fail)
        let metadata = {};
        try {
            metadata = await storageProvider.getMetadata(session.r2Key, 'ssd');
        } catch (e) {
            // Metadata fetch is optional
            console.log('Could not fetch R2 metadata:', e.message);
        }

        // Calculate expiry date based on user role
        let expiresAt = null;
        if (!req.user.isPremiumOrAdmin()) {
            // Free users get expiry
            expiresAt = new Date(Date.now() + config.expiry.daysFree * 24 * 60 * 60 * 1000);
        }

        // Create file record - use r2Key which has the full path with prefix
        const { File } = await import('../models/index.js');
        const file = await File.create({
            userId,
            originalName: session.originalName || session.filename,
            mimeType: session.mimeType,
            size: session.totalSize,
            storageKey: session.r2Key, // Use r2Key which has hot/ prefix
            storageTier: 'ssd',
            folderId: session.folderId,
            hash: metadata?.etag,
            expiresAt,  // ← ADDED: Set expiry for free users
        });

        // Update quota
        const quota = await Quota.getOrCreate(userId);
        await quota.addFile(file.size);

        // Mark session complete
        session.status = 'completed';
        session.fileId = file._id;
        await session.save();

        logger.info('R2 upload completed', {
            sessionId,
            fileId: file._id,
            size: file.size,
        });

        res.json({
            success: true,
            fileId: file._id,
            downloadUrl: `/d/${file._id}`,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Abort R2 multipart upload
 */
export async function abortR2Upload(req, res, next) {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id;

        const session = await UploadSession.findOne({ sessionId, userId });
        if (!session) {
            return res.json({ success: true, message: 'Session not found' });
        }

        // Abort multipart upload in R2
        if (session.r2UploadId && session.r2Key) {
            try {
                await storageProvider.abortMultipartUpload(
                    session.r2Key,
                    session.r2UploadId
                );
            } catch (err) {
                logger.warn('R2 abort failed', { error: err.message });
            }
        }

        session.status = 'failed';
        await session.save();

        logger.info('R2 upload aborted', { sessionId });

        res.json({ success: true, message: 'Upload aborted' });
    } catch (error) {
        next(error);
    }
}

/**
 * Check if storage provider is R2
 */
export async function getStorageInfo(req, res, next) {
    try {
        res.json({
            provider: config.storage.provider,
            isR2: config.storage.provider === 'r2',
            chunkSize: config.upload.chunkSize,
        });
    } catch (error) {
        next(error);
    }
}
