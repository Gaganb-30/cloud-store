/**
 * Auth Context
 * Manages authentication state and quota
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { getAccessToken, clearTokens } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [quota, setQuota] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = getAccessToken();
            if (token) {
                try {
                    const data = await authApi.getMe();
                    setUser(data.user);
                    setQuota(data.quota);
                } catch (error) {
                    clearTokens();
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = useCallback(async (email, password) => {
        const userData = await authApi.login(email, password);
        setUser(userData);
        // Fetch quota after login
        try {
            const data = await authApi.getMe();
            setQuota(data.quota);
        } catch { }
        return userData;
    }, []);

    const register = useCallback(async (email, username, password) => {
        const userData = await authApi.register(email, username, password);
        setUser(userData);
        // Fetch quota after register
        try {
            const data = await authApi.getMe();
            setQuota(data.quota);
        } catch { }
        return userData;
    }, []);

    const logout = useCallback(async () => {
        await authApi.logout();
        setUser(null);
        setQuota(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const data = await authApi.getMe();
            setUser(data.user);
            setQuota(data.quota);
            return data.user;
        } catch {
            setUser(null);
            setQuota(null);
            return null;
        }
    }, []);

    const value = {
        user,
        quota,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isPremium: user?.role === 'premium' || user?.role === 'admin',
        login,
        register,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export default AuthContext;
