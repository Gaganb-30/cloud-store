/**
 * Files API
 */
import client from './client';

export const filesApi = {
    async getUserFiles(page = 1, limit = 20, sort = '-createdAt') {
        const response = await client.get('/files', {
            params: { page, limit, sort },
        });
        return response.data;
    },

    async getFileInfo(fileId) {
        const response = await client.get(`/download/info/${fileId}`);
        return response.data;
    },

    async deleteFile(fileId) {
        const response = await client.delete(`/files/${fileId}`);
        return response.data;
    },

    async renameFile(fileId, newFilename) {
        const response = await client.patch(`/files/${fileId}/rename`, { filename: newFilename });
        return response.data;
    },

    getDownloadUrl(fileId) {
        return `/api/download/${fileId}`;
    },
};

export default filesApi;
