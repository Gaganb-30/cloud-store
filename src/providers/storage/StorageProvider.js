/**
 * Storage Provider Interface
 * Abstract base class defining the storage contract
 * Implementations: LocalStorageProvider, S3StorageProvider (future)
 */

import { StorageError } from '../../utils/errors.js';

/**
 * Storage tiers enum
 */
export const StorageTier = {
    HOT: 'ssd',   // Fast access, new uploads, premium files
    COLD: 'hdd', // Slow access, archived files
};

/**
 * Abstract Storage Provider
 * All storage implementations must extend this class
 */
export class StorageProvider {
    /**
     * Initialize storage provider
     * @returns {Promise<void>}
     */
    async initialize() {
        throw new StorageError('Method not implemented: initialize()', 'initialize');
    }

    /**
     * Write data to storage
     * @param {string} key - Unique storage key
     * @param {Buffer|ReadStream} data - Data to write
     * @param {Object} options - Write options
     * @param {string} options.tier - Storage tier (hot/cold)
     * @param {Object} options.metadata - Additional metadata
     * @returns {Promise<Object>} Write result with key, size, etc.
     */
    async write(key, data, options = {}) {
        throw new StorageError('Method not implemented: write()', 'write');
    }

    /**
     * Read data from storage
     * @param {string} key - Storage key
     * @param {string} tier - Storage tier to read from
     * @returns {Promise<Buffer>} File data
     */
    async read(key, tier = StorageTier.HOT) {
        throw new StorageError('Method not implemented: read()', 'read');
    }

    /**
     * Get a readable stream for file
     * @param {string} key - Storage key
     * @param {string} tier - Storage tier
     * @param {Object} options - Stream options
     * @param {number} options.start - Start byte for range
     * @param {number} options.end - End byte for range
     * @returns {ReadStream} File stream
     */
    getStream(key, tier = StorageTier.HOT, options = {}) {
        throw new StorageError('Method not implemented: getStream()', 'getStream');
    }

    /**
     * Delete a file from storage
     * @param {string} key - Storage key
     * @param {string} tier - Storage tier
     * @returns {Promise<boolean>} True if deleted
     */
    async delete(key, tier = StorageTier.HOT) {
        throw new StorageError('Method not implemented: delete()', 'delete');
    }

    /**
     * Check if file exists
     * @param {string} key - Storage key
     * @param {string} tier - Storage tier
     * @returns {Promise<boolean>} True if exists
     */
    async exists(key, tier = StorageTier.HOT) {
        throw new StorageError('Method not implemented: exists()', 'exists');
    }

    /**
     * Get file metadata (size, modified time, etc.)
     * @param {string} key - Storage key
     * @param {string} tier - Storage tier
     * @returns {Promise<Object>} File metadata
     */
    async getMetadata(key, tier = StorageTier.HOT) {
        throw new StorageError('Method not implemented: getMetadata()', 'getMetadata');
    }

    /**
     * Move file between tiers
     * @param {string} key - Storage key
     * @param {string} fromTier - Source tier
     * @param {string} toTier - Destination tier
     * @returns {Promise<void>}
     */
    async migrate(key, fromTier, toTier) {
        throw new StorageError('Method not implemented: migrate()', 'migrate');
    }

    /**
     * Write a chunk for chunked uploads
     * @param {string} sessionId - Upload session ID
     * @param {number} chunkIndex - Chunk index
     * @param {Buffer} data - Chunk data
     * @returns {Promise<Object>} Chunk info
     */
    async writeChunk(sessionId, chunkIndex, data) {
        throw new StorageError('Method not implemented: writeChunk()', 'writeChunk');
    }

    /**
     * Assemble chunks into final file
     * @param {string} sessionId - Upload session ID
     * @param {string} finalKey - Final storage key
     * @param {number} totalChunks - Total number of chunks
     * @param {string} tier - Target storage tier
     * @returns {Promise<Object>} Final file info
     */
    async assembleChunks(sessionId, finalKey, totalChunks, tier = StorageTier.HOT) {
        throw new StorageError('Method not implemented: assembleChunks()', 'assembleChunks');
    }

    /**
     * Delete chunks for an upload session
     * @param {string} sessionId - Upload session ID
     * @returns {Promise<void>}
     */
    async deleteChunks(sessionId) {
        throw new StorageError('Method not implemented: deleteChunks()', 'deleteChunks');
    }

    /**
     * Get storage usage statistics
     * @returns {Promise<Object>} Storage stats
     */
    async getStats() {
        throw new StorageError('Method not implemented: getStats()', 'getStats');
    }

    /**
     * Health check
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        throw new StorageError('Method not implemented: healthCheck()', 'healthCheck');
    }
}
