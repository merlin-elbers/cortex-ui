"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {redirect} from "next/navigation";

export type UserPublic = {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    lastSeen: Date | string;
};

type AuthContextType = {
    user: UserPublic | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserPublic | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    },
                });

                if (res.status === 200) {
                    const json = await res.json()
                    setUser(json.data)
                } else {
                    setUser(null)
                }
            } catch {
                setUser(null)
            } finally {
                setLoading(false)
            }
        };
        fetchUser()
    }, []);

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

            if (!res.ok) return false

            const json = await res.json()
            localStorage.setItem("access_token", json.data.accessToken)

            const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/auth/me`, {
                headers: {
                    Authorization: `Bearer ${json.data.accessToken}`,
                },
            })

            if (userRes.ok) {
                const data = await userRes.json()
                setUser(data.user)
            }

            return true
        } catch {
            return false
        }
    };

    const logout = () => {
        localStorage.removeItem("access_token")
        setUser(null)
        redirect(`${process.env.NEXT_PUBLIC_APP_URI}/login`)
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
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