'use client';

import React, {createContext, useContext, useEffect, useState} from 'react';
import Bus from "@/lib/bus";
import {AuthContextType} from "@/types/Context";
import {UserPublic} from "@/types/User";
import {WhiteLabelConfig} from "@/types/WhiteLabel";
import {ServerStatus} from "@/types/System";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({children}: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserPublic | null>(null);
    const [loading, setLoading] = useState(true);
    const [setupDone, setSetupDone] = useState(true);
    const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>({
        title: 'Cortex UI',
        showTitle: false,
    });
    const [serverStatus, setServerStatus] = useState<ServerStatus>({
        databaseOnline: false,
        selfSignupEnabled: false,
        smtpServerConfigured: false,
        m365Configured: false,
        matomoConfigured: false,
    })

    const refreshWhiteLabelConfig = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/white-label`);
            const json = await res.json();

            setWhiteLabelConfig({
                logo: json.data.logo !== null ? json.data.logo : undefined,
                title: json.data.title ?? '',
                showTitle: json.data.showTitle,
                subtitle: json.data.subtitle ?? '',
                description: json.data.description ?? '',
                contactMail: json.data.contactMail ?? '',
                contactPhone: json.data.contactPhone ?? '',
                contactFax: json.data.contactFax ?? '',
            });
        } catch (err) {
            Bus.emit('notification', {
                title: 'Fehler beim Abruf',
                message: `WhiteLabel Daten konnten nicht vom Server abgerufen werden. ${err}`,
                category: 'error'
            })
        }
    };

    const refreshSystemStatus = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/status`);
            const json = await res.json();

            if (json.isOk) setServerStatus(json.data)
        } catch (err) {
            Bus.emit('notification', {
                title: 'Fehler beim Abruf',
                message: `Serverstatus konnte nicht vom Server abgerufen werden. ${err}`,
                category: 'error'
            })
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

            if (res.status !== 200) {
                Bus.emit('notification', {
                    title: "Fehler beim Login",
                    message: "Bitte prüfen Sie die ihre E-Mail und ihr Passwort.",
                    categoryName: "warning"
                })
                return false;
            }

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
                if (!setupJson.setupCompleted) return

                await refreshWhiteLabelConfig();
                await refreshSystemStatus();

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
                serverStatus,
                refreshSystemStatus,
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
