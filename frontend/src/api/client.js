/**
 * API Client
 * Axios instance with JWT interceptors
 */
import axios from 'axios';

const API_BASE = '/api';

// Create axios instance
const client = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token management
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

export const setTokens = (access, refresh) => {
    accessToken = access;
    refreshToken = refresh;
    if (access) {
        localStorage.setItem('accessToken', access);
    } else {
        localStorage.removeItem('accessToken');
    }
    if (refresh) {
        localStorage.setItem('refreshToken', refresh);
    } else {
        localStorage.removeItem('refreshToken');
    }
};

export const clearTokens = () => {
    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

export const getAccessToken = () => accessToken;

// Request interceptor - add auth header
client.interceptors.request.use(
    (config) => {
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token) => {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
};

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we have a refresh token, try to refresh
        if (error.response?.status === 401 && refreshToken && !originalRequest._retry) {
            if (isRefreshing) {
                // Wait for token refresh
                return new Promise((resolve) => {
                    subscribeTokenRefresh((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(client(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(`${API_BASE}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
                setTokens(newAccessToken, newRefreshToken);
                onTokenRefreshed(newAccessToken);
                isRefreshing = false;

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return client(originalRequest);
            } catch (refreshError) {
                clearTokens();
                isRefreshing = false;
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default client;
