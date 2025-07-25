'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserPublic = {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    lastSeen: Date | string;
};

interface WhiteLabelLogo {
    contentType?: string;
    name?: string;
    data?: string;
    lastModified?: string | number;
}

interface WhiteLabelConfig {
    logo?: WhiteLabelLogo;
    title: string;
}

type AuthContextType = {
    user: UserPublic | null;
    isAuthenticated: boolean;
    setupCompleted: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    refreshSetupCompleted: () => void;
    whiteLabelConfig: WhiteLabelConfig;
    refreshWhiteLabelConfig: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserPublic | null>(null);
    const [loading, setLoading] = useState(true);
    const [setupDone, setSetupDone] = useState(true);
    const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>({
        title: 'Cortex UI',
    });

    const refreshWhiteLabelConfig = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/white-label`);
            const json = await res.json();

            setWhiteLabelConfig({
                logo: json.logo !== null ? json.logo : undefined,
                title: json.title ?? 'Cortex UI',
            });
        } catch (err) {
            console.error('WhiteLabel fetch failed:', err);
        }
    };

    const refreshSetupDone = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/setup/status`);
            const json = await res.json();
            setSetupDone(json.setupCompleted);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const urlencoded = new URLSearchParams();
            urlencoded.append('username', email);
            urlencoded.append('password', password);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: urlencoded,
            });

            if (res.status !== 200) return false;

            const json = await res.json();
            localStorage.setItem('access_token', json.data.accessToken);

            const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/auth/me`, {
                headers: {
                    Authorization: `Bearer ${json.data.accessToken}`,
                },
            });

            if (userRes.status !== 200) return false;
            const userJson = await userRes.json();

            if (userJson.isOk) {
                setUser(userJson.data);
                return true;
            } else {
                setUser(null);
                return false;
            }
        } catch {
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setUser(null);
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const setupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/setup/status`);
                const setupJson = await setupRes.json();
                setSetupDone(setupJson.setupCompleted);

                await refreshWhiteLabelConfig();

                const token = localStorage.getItem('access_token');
                if (!token) return;

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.status === 200) {
                    const json = await res.json();
                    setUser(json.data);
                } else {
                    setUser(null);
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                setupCompleted: setupDone,
                loading,
                login,
                logout,
                refreshSetupCompleted: refreshSetupDone,
                whiteLabelConfig,
                refreshWhiteLabelConfig,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
