/**
 * Cloudflare R2 Storage Provider
 * S3-compatible object storage with presigned URL support for direct uploads
 */

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    ListPartsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider, StorageTier } from './StorageProvider.js';
import { StorageError } from '../../utils/errors.js';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

/**
 * Cloudflare R2 Storage Provider
 * Uses AWS S3 SDK (R2 is S3-compatible)
 */
export class R2StorageProvider extends StorageProvider {
    constructor() {
        super();
        this.client = null;
        this.bucket = null;
        this.publicUrl = null;
    }

    /**
     * Initialize R2 client
     */
    async initialize() {
        const r2Config = config.r2;

        if (!r2Config?.accountId || !r2Config?.accessKeyId || !r2Config?.secretAccessKey) {
            throw new StorageError('R2 credentials not configured', 'initialize');
        }

        this.bucket = r2Config.bucketName;
        this.publicUrl = r2Config.publicUrl;

        // R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
        const endpoint = `https://${r2Config.accountId}.r2.cloudflarestorage.com`;

        this.client = new S3Client({
            region: 'auto',
            endpoint,
            credentials: {
                accessKeyId: r2Config.accessKeyId,
                secretAccessKey: r2Config.secretAccessKey,
            },
        });

        // Test connection
        try {
            await this.client.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: '.health-check',
            }));
        } catch (err) {
            // 404 is fine, means bucket exists but file doesn't
            if (err.name !== 'NotFound') {
                logger.warn('R2 health check warning', { error: err.message });
            }
        }

        logger.info('R2StorageProvider initialized', { bucket: this.bucket });
    }

    /**
     * Get storage key with optional prefix
     */
    _getKey(key, tier = StorageTier.HOT) {
        // R2 doesn't have tiers, but we can use prefixes for organization
        const prefix = tier === StorageTier.COLD ? 'cold/' : 'hot/';
        return `${prefix}${key}`;
    }

    /**
     * Write data to R2
     */
    async write(key, data, options = {}) {
        const { tier = StorageTier.HOT, metadata = {} } = options;
        const fullKey = this._getKey(key, tier);

        try {
            await this.client.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: fullKey,
                Body: data,
                Metadata: metadata,
                ContentType: options.contentType || 'application/octet-stream',
            }));

            const size = Buffer.isBuffer(data) ? data.length : data.byteLength || 0;

            logger.debug('R2 file written', { key: fullKey, size });

            return {
                key,
                tier,
                size,
                storageKey: fullKey,
            };
        } catch (error) {
            logger.error('R2 write failed', { key: fullKey, error: error.message });
            throw new StorageError(`R2 write failed: ${error.message}`, 'write');
        }
    }

    /**
     * Read data from R2
     */
    async read(key, tier = StorageTier.HOT) {
        // Don't add prefix if key already has it
        const fullKey = key.startsWith('hot/') || key.startsWith('cold/')
            ? key
            : this._getKey(key, tier);

        try {
            const response = await this.client.send(new GetObjectCommand({
                Bucket: this.bucket,
                Key: fullKey,
            }));

            // Convert stream to buffer
            const chunks = [];
            for await (const chunk of response.Body) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        } catch (error) {
            if (error.name === 'NoSuchKey') {
                throw new StorageError(`File not found: ${key}`, 'read');
            }
            throw new StorageError(`R2 read failed: ${error.message}`, 'read');
        }
    }

    /**
     * Get readable stream from R2
     */
    async getStream(key, tier = StorageTier.HOT, options = {}) {
        // Don't add prefix if key already has it (for R2 multipart uploads)
        const fullKey = key.startsWith('hot/') || key.startsWith('cold/')
            ? key
            : this._getKey(key, tier);

        try {
            const params = {
                Bucket: this.bucket,
                Key: fullKey,
            };

            // Support range requests
            if (options.start !== undefined || options.end !== undefined) {
                params.Range = `bytes=${options.start || 0}-${options.end || ''}`;
            }

            const response = await this.client.send(new GetObjectCommand(params));
            return response.Body;
        } catch (error) {
            if (error.name === 'NoSuchKey') {
                throw new StorageError(`File not found: ${key}`, 'getStream');
            }
            throw new StorageError(`R2 stream failed: ${error.message}`, 'getStream');
        }
    }

    /**
     * Delete file from R2
     */
    async delete(key, tier = StorageTier.HOT) {
        // Don't add prefix if key already has it
        const fullKey = key.startsWith('hot/') || key.startsWith('cold/')
            ? key
            : this._getKey(key, tier);

        try {
            await this.client.send(new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: fullKey,
            }));

            logger.debug('R2 file deleted', { key: fullKey });
            return true;
        } catch (error) {
            logger.warn('R2 delete failed', { key: fullKey, error: error.message });
            return false;
        }
    }

    /**
     * Check if file exists in R2
     */
    async exists(key, tier = StorageTier.HOT) {
        // Don't add prefix if key already has it
        const fullKey = key.startsWith('hot/') || key.startsWith('cold/')
            ? key
            : this._getKey(key, tier);

        try {
            await this.client.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: fullKey,
            }));
            return true;
        } catch (error) {
            if (error.name === 'NotFound') {
                return false;
            }
            throw new StorageError(`R2 exists check failed: ${error.message}`, 'exists');
        }
    }

    /**
     * Get file metadata from R2
     */
    async getMetadata(key, tier = StorageTier.HOT) {
        // Don't add prefix if key already has it
        const fullKey = key.startsWith('hot/') || key.startsWith('cold/')
            ? key
            : this._getKey(key, tier);

        try {
            const response = await this.client.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: fullKey,
            }));

            return {
                key,
                tier,
                size: response.ContentLength,
                contentType: response.ContentType,
                modified: response.LastModified,
                etag: response.ETag,
                metadata: response.Metadata,
            };
        } catch (error) {
            if (error.name === 'NotFound') {
                throw new StorageError(`File not found: ${key}`, 'getMetadata');
            }
            throw new StorageError(`R2 metadata failed: ${error.message}`, 'getMetadata');
        }
    }

    /**
     * Migrate file between tiers (copy to new prefix)
     */
    async migrate(key, fromTier, toTier) {
        const sourceKey = this._getKey(key, fromTier);
        const destKey = this._getKey(key, toTier);

        try {
            // Read from source
            const data = await this.read(key, fromTier);

            // Write to destination
            await this.write(key, data, { tier: toTier });

            // Delete from source
            await this.delete(key, fromTier);

            logger.info('R2 file migrated', { key, fromTier, toTier });
        } catch (error) {
            throw new StorageError(`R2 migration failed: ${error.message}`, 'migrate');
        }
    }

    // ==================== Chunked Upload Support ====================

    /**
     * Write chunk to R2 temp location
     */
    async writeChunk(sessionId, chunkIndex, data) {
        const chunkKey = `temp/${sessionId}/chunk_${chunkIndex}`;

        try {
            await this.client.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: chunkKey,
                Body: data,
            }));

            return {
                sessionId,
                chunkIndex,
                size: data.length,
                key: chunkKey,
            };
        } catch (error) {
            throw new StorageError(`R2 chunk write failed: ${error.message}`, 'writeChunk');
        }
    }

    /**
     * Assemble chunks into final file
     */
    async assembleChunks(sessionId, finalKey, totalChunks, tier = StorageTier.HOT) {
        const fullKey = this._getKey(finalKey, tier);

        try {
            // Read all chunks and concatenate
            const chunks = [];
            for (let i = 0; i < totalChunks; i++) {
                const chunkKey = `temp/${sessionId}/chunk_${i}`;
                const response = await this.client.send(new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: chunkKey,
                }));

                const chunkData = [];
                for await (const chunk of response.Body) {
                    chunkData.push(chunk);
                }
                chunks.push(Buffer.concat(chunkData));
            }

            const finalData = Buffer.concat(chunks);

            // Write final file
            await this.client.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: fullKey,
                Body: finalData,
            }));

            // Clean up chunks
            await this.deleteChunks(sessionId);

            logger.info('R2 chunks assembled', { sessionId, finalKey: fullKey, size: finalData.length });

            return {
                key: finalKey,
                storageKey: fullKey,
                tier,
                size: finalData.length,
            };
        } catch (error) {
            throw new StorageError(`R2 assembly failed: ${error.message}`, 'assembleChunks');
        }
    }

    /**
     * Delete all chunks for a session
     */
    async deleteChunks(sessionId) {
        const prefix = `temp/${sessionId}/`;

        try {
            // List and delete all chunks
            // Note: R2 doesn't have ListObjectsV2 on all plans, so we try sequential deletion
            for (let i = 0; i < 10000; i++) {
                const chunkKey = `${prefix}chunk_${i}`;
                try {
                    await this.client.send(new DeleteObjectCommand({
                        Bucket: this.bucket,
                        Key: chunkKey,
                    }));
                } catch (err) {
                    // Stop when chunk doesn't exist
                    if (err.name === 'NoSuchKey') break;
                }
            }

            logger.debug('R2 chunks deleted', { sessionId });
        } catch (error) {
            logger.warn('R2 chunk cleanup failed', { sessionId, error: error.message });
        }
    }

    // ==================== Presigned URL Support ====================

    /**
     * Generate presigned URL for direct upload
     */
    async getPresignedUploadUrl(key, tier = StorageTier.HOT, expiresIn = 86400) {
        const fullKey = this._getKey(key, tier);

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: fullKey,
        });

        const url = await getSignedUrl(this.client, command, { expiresIn });

        return {
            url,
            key: fullKey,
            expiresIn,
            method: 'PUT',
        };
    }

    /**
     * Generate presigned URL for download
     */
    async getPresignedDownloadUrl(key, tier = StorageTier.HOT, expiresIn = 3600) {
        const fullKey = this._getKey(key, tier);

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: fullKey,
        });

        const url = await getSignedUrl(this.client, command, { expiresIn });

        return {
            url,
            key: fullKey,
            expiresIn,
        };
    }

    // ==================== Multipart Upload (for large files) ====================

    /**
     * Initialize multipart upload
     */
    async initMultipartUpload(key, tier = StorageTier.HOT) {
        const fullKey = this._getKey(key, tier);

        const response = await this.client.send(new CreateMultipartUploadCommand({
            Bucket: this.bucket,
            Key: fullKey,
        }));

        return {
            uploadId: response.UploadId,
            key: fullKey,
        };
    }

    /**
     * Get presigned URL for uploading a part
     */
    async getPartUploadUrl(key, uploadId, partNumber, expiresIn = 86400) {
        const command = new UploadPartCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
        });

        const url = await getSignedUrl(this.client, command, { expiresIn });

        return {
            url,
            partNumber,
            expiresIn,
        };
    }

    /**
     * Complete multipart upload
     */
    async completeMultipartUpload(key, uploadId, parts) {
        await this.client.send(new CompleteMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: parts.map((etag, index) => ({
                    ETag: etag,
                    PartNumber: index + 1,
                })),
            },
        }));

        return { key, completed: true };
    }

    /**
     * Abort multipart upload
     */
    async abortMultipartUpload(key, uploadId) {
        await this.client.send(new AbortMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
        }));
    }

    // ==================== Stats & Health ====================

    /**
     * Get storage stats (R2 doesn't provide this easily)
     */
    async getStats() {
        return {
            provider: 'r2',
            bucket: this.bucket,
            available: true,
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            await this.client.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: '.health-check',
            }));
            return true;
        } catch (err) {
            if (err.name === 'NotFound') return true; // Bucket accessible
            return false;
        }
    }

    /**
     * Get public URL for a file (if bucket is public)
     */
    getPublicUrl(key, tier = StorageTier.HOT) {
        if (!this.publicUrl) return null;
        const fullKey = this._getKey(key, tier);
        return `${this.publicUrl}/${fullKey}`;
    }
}

// Export singleton instance
const r2StorageProvider = new R2StorageProvider();
export default r2StorageProvider;
