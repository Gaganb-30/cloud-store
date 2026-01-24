/**
 * Upload API
 * Handles chunked uploads with progress tracking
 * Supports both local storage and R2 presigned URL uploads
 */
import client, { getAccessToken } from './client';

// Get API base URL
const API_BASE = '/api';

export const uploadApi = {
    // Get storage provider info
    async getStorageInfo() {
        const response = await client.get('/upload/storage-info');
        return response.data;
    },

    // ==================== Local Storage Upload ====================
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

    // ==================== R2 Direct Upload (Presigned URLs) ====================
    async initR2Upload(filename, size, mimeType, folderId = null) {
        const response = await client.post('/upload/r2/init', {
            filename,
            size,
            mimeType,
            folderId,
        });
        return response.data;
    },

    async uploadPartToR2(presignedUrl, partData, onProgress) {
        const xhr = new XMLHttpRequest();

        return new Promise((resolve, reject) => {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && onProgress) {
                    onProgress(e.loaded, e.total);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // Get ETag from response headers
                    const etag = xhr.getResponseHeader('ETag');
                    resolve({ etag: etag?.replace(/"/g, '') || '' });
                } else {
                    reject(new Error(`Upload failed: ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.onabort = () => reject(new Error('Upload cancelled'));

            xhr.open('PUT', presignedUrl);
            xhr.send(partData);
        });
    },

    async completeR2Upload(sessionId, parts) {
        const response = await client.post(`/upload/r2/complete/${sessionId}`, { parts });
        return response.data;
    },

    async abortR2Upload(sessionId) {
        const response = await client.delete(`/upload/r2/abort/${sessionId}`);
        return response.data;
    },
};

export default uploadApi;
