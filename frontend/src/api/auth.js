/**
 * Auth API
 */
import client, { setTokens, clearTokens } from './client';

export const authApi = {
    // Step 1: Initiate registration - send verification OTP
    async initiateRegister(email, username, password) {
        const response = await client.post('/auth/initiate-register', { email, username, password });
        return response.data;
    },

    // Step 2: Complete registration - verify OTP
    async completeRegister(email, otp) {
        const response = await client.post('/auth/complete-register', { email, otp });
        const { accessToken, refreshToken, user } = response.data;
        setTokens(accessToken, refreshToken);
        return user;
    },

    // Legacy direct registration
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

    // Password Reset (Forgot Password)
    async forgotPassword(email) {
        const response = await client.post('/auth/forgot-password', { email });
        return response.data;
    },

    async verifyOtp(email, otp) {
        const response = await client.post('/auth/verify-otp', { email, otp });
        return response.data;
    },

    async resetPassword(email, newPassword) {
        const response = await client.post('/auth/reset-password', { email, newPassword });
        return response.data;
    },
};

export default authApi;
