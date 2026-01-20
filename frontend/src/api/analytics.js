/**
 * Analytics API
 */
import client from './client';

export const analyticsApi = {
    async getAnalytics(period = 30) {
        const response = await client.get('/analytics', {
            params: { period },
        });
        return response.data;
    },
};

export default analyticsApi;
