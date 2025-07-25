"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserPublic = {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    lastSeen: Date | string;
}

interface WhiteLabelConfig {
    logo?: {
        contentType?: string
        name?: string
        data?: string
        lastModified?: string | number
    },
    title: string
}

type AuthContextType = {
    user: UserPublic | null;
    isAuthenticated: boolean;
    setupCompleted: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    refreshSetupCompleted: () => void
    whiteLabelConfig: WhiteLabelConfig
    refreshWhiteLabelConfig: () => void
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserPublic | null>(null);
    const [loading, setLoading] = useState(true);
    const [setupDone, setSetupDone] = useState<boolean>(true);
    const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>({
        title: 'Cortex UI'
    });

    useEffect(() => {
        const fetchStatusAndUser = async () => {
            try {
                const setupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/setup/status`);
                const setupJson = await setupRes.json();

                setSetupDone(setupJson.setupCompleted)

                const whiteLabelRes = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/white-label`)
                const whiteLabelJson = await whiteLabelRes.json()

                setWhiteLabelConfig({
                    logo: whiteLabelJson.logo !== null ? whiteLabelJson.logo : undefined,
                    title: whiteLabelJson.title,
                })

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
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

        fetchStatusAndUser()
    }, []);

    const refreshWhiteLabelConfig = async () => {
        const whiteLabelRes = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/white-label`)
        const whiteLabelJson = await whiteLabelRes.json()

        setWhiteLabelConfig({
            logo: whiteLabelJson.logo !== null ? whiteLabelJson.logo : undefined,
            title: whiteLabelJson.title,
        })
    }

    const refreshSetupDone = async () => {
        try {
            const setupRes = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/setup/status`);
            const setupJson = await setupRes.json();
            setSetupDone(setupJson.setupCompleted)
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    const login = async (email: string, password: string) => {
        try {
            const urlencoded = new URLSearchParams();
            urlencoded.append("username", email);
            urlencoded.append("password", password);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/auth/login`, {
                method: "POST",
                headers: {
                    ContentType: 'x-www-form-urlencoded',
                },
                body: urlencoded,
            });

            if (res.status !== 200) return false

            const json = await res.json()
            localStorage.setItem("access_token", json.data.accessToken)

            const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/auth/me`, {
                headers: {
                    Authorization: `Bearer ${json.data.accessToken}`,
                },
            })
            if (userRes.status !== 200) return false
            const data = await userRes.json()

            if (data.isOk) {
                setUser(json.data)
                return true
            } else {
                setUser(null)
                return false
            }
        } catch {
            return false
        }
    };

    const logout = () => {
        localStorage.removeItem("access_token")
        setUser(null)
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                whiteLabelConfig,
                refreshWhiteLabelConfig,
                setupCompleted: setupDone,
                isAuthenticated: !!user,
                refreshSetupCompleted: refreshSetupDone,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};