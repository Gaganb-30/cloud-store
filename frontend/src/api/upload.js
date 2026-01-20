/**
 * Upload API
 * Handles chunked uploads with progress tracking
 */
import client, { getAccessToken } from './client';

// Get API base URL
const API_BASE = '/api';

export const uploadApi = {
    async initUpload(filename, size, hash, mimeType, folderId = null) {
        const response = await client.post('/upload/init', {
            filename,
            size,
            hash,
            mimeType,
            folderId,
        });
        return response.data;
    },

    async uploadChunk(sessionId, chunkIndex, chunkData, chunkHash, onProgress) {
        const response = await fetch(`${API_BASE}/upload/chunk/${sessionId}/${chunkIndex}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAccessToken()}`,
                'Content-Type': 'application/octet-stream',
                'X-Chunk-Hash': chunkHash || '',
            },
            body: chunkData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Chunk upload failed');
        }

        return response.json();
    },

    async getUploadStatus(sessionId) {
        const response = await client.get(`/upload/status/${sessionId}`);
        return response.data;
    },

    async completeUpload(sessionId) {
        const response = await client.post(`/upload/complete/${sessionId}`);
        return response.data;
    },

    async abortUpload(sessionId) {
        const response = await client.delete(`/upload/abort/${sessionId}`);
        return response.data;
    },

    async resumeUpload(sessionId) {
        const response = await client.get(`/upload/resume/${sessionId}`);
        return response.data;
    },
};

export default uploadApi;
