/**
 * Local Storage Provider
 * Filesystem-based storage with SSD/HDD tiered support
 */

import { promises as fs, createReadStream, createWriteStream, constants } from 'fs';
import { join, dirname } from 'path';
import { pipeline } from 'stream/promises';
import { StorageProvider, StorageTier } from './StorageProvider.js';
import { StorageError } from '../../utils/errors.js';
import { sha256File } from '../../utils/hash.js';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

/**
 * Local filesystem storage provider
 * Supports tiered storage (SSD/HDD) with atomic operations
 */
export class LocalStorageProvider extends StorageProvider {
    constructor() {
        super();
        this.paths = {
            [StorageTier.HOT]: config.storage.ssdPath,
            [StorageTier.COLD]: config.storage.hddPath,
            temp: config.storage.tempPath,
        };
    }

    /**
     * Initialize storage directories
     */
    async initialize() {
        const dirs = [
            join(this.paths[StorageTier.HOT], 'files'),
            join(this.paths[StorageTier.COLD], 'files'),
            this.paths.temp,
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
            logger.debug(`Storage directory ensured: ${dir}`);
        }

        logger.info('LocalStorageProvider initialized');
    }

    /**
     * Get full path for a storage key
     */
    _getPath(key, tier) {
        // Sanitize key to prevent path traversal
        const sanitized = this._sanitizeKey(key);
        return join(this.paths[tier], 'files', sanitized);
    }

    /**
     * Get temp path for chunks
     */
    _getTempPath(sessionId, chunkIndex = null) {
        const sanitized = this._sanitizeKey(sessionId);
        if (chunkIndex !== null) {
            return join(this.paths.temp, sanitized, `chunk_${chunkIndex}`);
        }
        return join(this.paths.temp, sanitized);
    }

    /**
     * Sanitize storage key to prevent path traversal attacks
     */
    _sanitizeKey(key) {
        // Remove any path traversal attempts
        return key
            .replace(/\.\./g, '')
            .replace(/[/\\]/g, '_')
            .replace(/[^a-zA-Z0-9_.-]/g, '');
    }

    /**
     * Write data to storage
     */
    async write(key, data, options = {}) {
        const tier = options.tier || StorageTier.HOT;
        const filePath = this._getPath(key, tier);

        try {
            // Ensure directory exists
            await fs.mkdir(dirname(filePath), { recursive: true });

            // Write atomically using temp file
            const tempPath = `${filePath}.tmp`;

            if (Buffer.isBuffer(data)) {
                await fs.writeFile(tempPath, data);
            } else if (data.pipe) {
                // It's a stream
                const writeStream = createWriteStream(tempPath);
                await pipeline(data, writeStream);
            } else {
                throw new StorageError('Invalid data type for write', 'write');
            }

            // Atomic rename
            await fs.rename(tempPath, filePath);

            // Get file stats
            const stats = await fs.stat(filePath);

            logger.debug(`File written: ${key}`, { tier, size: stats.size });

            return {
                key,
                tier,
                size: stats.size,
                path: filePath,
            };
        } catch (error) {
            logger.error('Storage write failed', { key, tier, error: error.message });
            throw new StorageError(`Write failed: ${error.message}`, 'write');
        }
    }

    /**
     * Read entire file into buffer
     */
    async read(key, tier = StorageTier.HOT) {
        const filePath = this._getPath(key, tier);

        try {
            await fs.access(filePath, constants.R_OK);
            return await fs.readFile(filePath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new StorageError(`File not found: ${key}`, 'read');
            }
            throw new StorageError(`Read failed: ${error.message}`, 'read');
        }
    }

    /**
     * Get readable stream (supports range requests)
     */
    getStream(key, tier = StorageTier.HOT, options = {}) {
        const filePath = this._getPath(key, tier);

        const streamOptions = {};
        if (options.start !== undefined) streamOptions.start = options.start;
        if (options.end !== undefined) streamOptions.end = options.end;

        return createReadStream(filePath, streamOptions);
    }

    /**
     * Delete a file
     */
    async delete(key, tier = StorageTier.HOT) {
        const filePath = this._getPath(key, tier);

        try {
            await fs.unlink(filePath);
            logger.debug(`File deleted: ${key}`, { tier });
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return false; // Already deleted
            }
            throw new StorageError(`Delete failed: ${error.message}`, 'delete');
        }
    }

    /**
     * Check if file exists
     */
    async exists(key, tier = StorageTier.HOT) {
        const filePath = this._getPath(key, tier);

        try {
            await fs.access(filePath, constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get file metadata
     */
    async getMetadata(key, tier = StorageTier.HOT) {
        const filePath = this._getPath(key, tier);

        try {
            const stats = await fs.stat(filePath);
            return {
                key,
                tier,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                path: filePath,
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new StorageError(`File not found: ${key}`, 'getMetadata');
            }
            throw new StorageError(`Get metadata failed: ${error.message}`, 'getMetadata');
        }
    }

    /**
     * Migrate file between storage tiers
     */
    async migrate(key, fromTier, toTier) {
        if (fromTier === toTier) return;

        const sourcePath = this._getPath(key, fromTier);
        const destPath = this._getPath(key, toTier);

        try {
            // Ensure destination directory exists
            await fs.mkdir(dirname(destPath), { recursive: true });

            // Copy file (can't rename across filesystems)
            await fs.copyFile(sourcePath, destPath);

            // Verify copy
            const sourceStats = await fs.stat(sourcePath);
            const destStats = await fs.stat(destPath);

            if (sourceStats.size !== destStats.size) {
                await fs.unlink(destPath);
                throw new Error('Migration verification failed: size mismatch');
            }

            // Delete source
            await fs.unlink(sourcePath);

            logger.info(`File migrated: ${key}`, { fromTier, toTier });
        } catch (error) {
            logger.error('Migration failed', { key, fromTier, toTier, error: error.message });
            throw new StorageError(`Migration failed: ${error.message}`, 'migrate');
        }
    }

    /**
     * Write a chunk for chunked uploads (optimized for speed)
     */
    async writeChunk(sessionId, chunkIndex, data) {
        const chunkPath = this._getTempPath(sessionId, chunkIndex);
        const sessionDir = dirname(chunkPath);

        try {
            // Create session dir only once (will succeed silently if exists)
            await fs.mkdir(sessionDir, { recursive: true }).catch(() => { });

            // Direct write without stat for speed
            await fs.writeFile(chunkPath, data);

            return {
                sessionId,
                chunkIndex,
                size: data.length,
                path: chunkPath,
            };
        } catch (error) {
            throw new StorageError(`Write chunk failed: ${error.message}`, 'writeChunk');
        }
    }

    /**
     * Assemble chunks into final file
     */
    async assembleChunks(sessionId, finalKey, totalChunks, tier = StorageTier.HOT) {
        const sessionDir = this._getTempPath(sessionId);
        const finalPath = this._getPath(finalKey, tier);
        const tempFinalPath = `${finalPath}.assembling`;

        try {
            await fs.mkdir(dirname(finalPath), { recursive: true });

            // Create write stream for final file
            const writeStream = createWriteStream(tempFinalPath);

            // Append each chunk in order
            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = this._getTempPath(sessionId, i);

                // Verify chunk exists
                try {
                    await fs.access(chunkPath, constants.R_OK);
                } catch {
                    throw new Error(`Missing chunk ${i}`);
                }

                // Append chunk to final file
                const chunkStream = createReadStream(chunkPath);
                await new Promise((resolve, reject) => {
                    chunkStream.pipe(writeStream, { end: false });
                    chunkStream.on('end', resolve);
                    chunkStream.on('error', reject);
                });
            }

            // Close write stream
            await new Promise((resolve, reject) => {
                writeStream.end();
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            // Atomic rename
            await fs.rename(tempFinalPath, finalPath);

            // Calculate hash of final file
            const hash = await sha256File(finalPath);
            const stats = await fs.stat(finalPath);

            // Clean up chunks
            await this.deleteChunks(sessionId);

            logger.info(`File assembled: ${finalKey}`, {
                totalChunks,
                size: stats.size,
                tier
            });

            return {
                key: finalKey,
                tier,
                size: stats.size,
                hash,
                path: finalPath,
            };
        } catch (error) {
            // Clean up temp file on failure
            try {
                await fs.unlink(tempFinalPath);
            } catch { }

            throw new StorageError(`Assembly failed: ${error.message}`, 'assembleChunks');
        }
    }

    /**
     * Delete all chunks for a session
     */
    async deleteChunks(sessionId) {
        const sessionDir = this._getTempPath(sessionId);

        try {
            await fs.rm(sessionDir, { recursive: true, force: true });
            logger.debug(`Chunks deleted for session: ${sessionId}`);
        } catch (error) {
            // Ignore if already deleted
            if (error.code !== 'ENOENT') {
                logger.warn(`Failed to delete chunks: ${sessionId}`, { error: error.message });
            }
        }
    }

    /**
     * Get storage statistics
     */
    async getStats() {
        const getTierStats = async (tier) => {
            const basePath = join(this.paths[tier], 'files');
            let totalSize = 0;
            let fileCount = 0;

            try {
                const files = await fs.readdir(basePath);
                for (const file of files) {
                    try {
                        const stats = await fs.stat(join(basePath, file));
                        if (stats.isFile()) {
                            totalSize += stats.size;
                            fileCount++;
                        }
                    } catch { }
                }
            } catch { }

            return { totalSize, fileCount };
        };

        const [hotStats, coldStats] = await Promise.all([
            getTierStats(StorageTier.HOT),
            getTierStats(StorageTier.COLD),
        ]);

        return {
            hot: hotStats,
            cold: coldStats,
            total: {
                totalSize: hotStats.totalSize + coldStats.totalSize,
                fileCount: hotStats.fileCount + coldStats.fileCount,
            },
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            // Try to write and delete a test file
            const testPath = join(this.paths.temp, '.health_check');
            await fs.writeFile(testPath, 'ok');
            await fs.unlink(testPath);
            return true;
        } catch {
            return false;
        }
    }
}

// Export singleton instance
const localStorageProvider = new LocalStorageProvider();
export default localStorageProvider;
