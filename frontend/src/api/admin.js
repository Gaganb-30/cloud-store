/**
 * Admin API
 */
import client from './client';

export const adminApi = {
    async getStats() {
        const response = await client.get('/admin/stats');
        return response.data;
    },

    async getUsers(page = 1, limit = 20, role = null, search = null) {
        const params = { page, limit };
        if (role) params.role = role;
        if (search) params.search = search;

        const response = await client.get('/admin/users', { params });
        return response.data;
    },

    async promoteUser(userId) {
        const response = await client.post(`/admin/users/${userId}/promote`);
        return response.data;
    },

    async demoteUser(userId) {
        const response = await client.post(`/admin/users/${userId}/demote`);
        return response.data;
    },

    async blockUser(userId) {
        const response = await client.post(`/admin/users/${userId}/block`);
        return response.data;
    },

    async restrictUser(userId) {
        const response = await client.post(`/admin/users/${userId}/restrict`);
        return response.data;
    },

    async unblockUser(userId) {
        const response = await client.post(`/admin/users/${userId}/unblock`);
        return response.data;
    },

    async bulkDeleteFiles(fileIds) {
        const response = await client.post('/admin/files/bulk-delete', { fileIds });
        return response.data;
    },

    async setUserQuota(userId, limits) {
        const response = await client.put(`/admin/users/${userId}/quota`, limits);
        return response.data;
    },

    async forceDeleteFile(fileId) {
        const response = await client.delete(`/admin/files/${fileId}`);
        return response.data;
    },

    async forceMigrateFile(fileId, tier) {
        const response = await client.post(`/admin/files/${fileId}/migrate`, { tier });
        return response.data;
    },

    async setFileExpiry(fileId, expiresAt) {
        const response = await client.put(`/admin/files/${fileId}/expiry`, { expiresAt });
        return response.data;
    },
};

export default adminApi;
