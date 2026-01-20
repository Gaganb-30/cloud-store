/**
 * Auth API
 */
import client, { setTokens, clearTokens } from './client';

export const authApi = {
    async register(email, username, password) {
        const response = await client.post('/auth/register', { email, username, password });
        const { accessToken, refreshToken, user } = response.data;
        setTokens(accessToken, refreshToken);
        return user;
    },

    async login(email, password) {
        const response = await client.post('/auth/login', { email, password });
        const { accessToken, refreshToken, user } = response.data;
        setTokens(accessToken, refreshToken);
        return user;
    },

    async logout() {
        try {
            await client.post('/auth/logout');
        } finally {
            clearTokens();
        }
    },

    async getMe() {
        const response = await client.get('/auth/me');
        return response.data;  // Returns { user, quota }
    },

    async changePassword(currentPassword, newPassword) {
        const response = await client.post('/auth/change-password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },

    async changeUsername(newUsername, password) {
        const response = await client.post('/auth/change-username', {
            newUsername,
            password,
        });
        return response.data;
    },

    async changeEmail(newEmail, password) {
        const response = await client.post('/auth/change-email', {
            newEmail,
            password,
        });
        return response.data;
    },
};

export default authApi;
