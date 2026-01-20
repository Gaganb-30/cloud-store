/**
 * Folders API
 */
import client from './client';

export const foldersApi = {
    async createFolder(name, parentId = null) {
        const response = await client.post('/folders', { name, parentId });
        return response.data;
    },

    async getFolders(parentId = null) {
        const params = parentId ? { parentId } : {};
        const response = await client.get('/folders', { params });
        return response.data;
    },

    async getFolderContents(folderId = 'root', options = {}) {
        const { page = 1, limit = 50, sort = 'name' } = options;
        const response = await client.get(`/folders/${folderId}/contents`, {
            params: { page, limit, sort },
        });
        return response.data;
    },

    async getFolder(folderId) {
        const response = await client.get(`/folders/${folderId}`);
        return response.data;
    },

    async renameFolder(folderId, name) {
        const response = await client.patch(`/folders/${folderId}`, { name });
        return response.data;
    },

    async moveFolder(folderId, parentId) {
        const response = await client.post(`/folders/${folderId}/move`, { parentId });
        return response.data;
    },

    async deleteFolder(folderId, cascade = false) {
        const response = await client.delete(`/folders/${folderId}`, {
            params: { cascade: cascade.toString() },
        });
        return response.data;
    },

    async moveFile(fileId, folderId) {
        const response = await client.post(`/folders/files/${fileId}/move`, { folderId });
        return response.data;
    },
};

export default foldersApi;
