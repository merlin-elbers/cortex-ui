'use client'

import React from 'react';
import {
    LayoutDashboard,
    FileText,
    BarChart3,
    LogOut,
    Users,
    Globe, Cog
} from 'lucide-react';
import {usePathname} from "next/navigation";
import Link from "next/link";
import CortexUI from "@/assets/CortexUI.png";
import {useAuth} from "@/context/AuthContext";
import Image from "next/image";
import Loader from "@/components/Loader";

const AdminSidebar = () => {
    const location = usePathname();
    const { user, isAuthenticated, loading, logout, whiteLabelConfig } = useAuth()

    const getRoleValue = (roleName: string) => {
        try {
            const roleValues = {
                viewer: 0,
                writer: 1,
                editor: 2,
                admin: 3
            }
            return roleValues[roleName as keyof typeof roleValues];
        } catch {
            return 0;
        }
    }

    const menuItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true, roleRequired: 'viewer' },
        { path: '/analytics', icon: BarChart3, label: 'Analytics', roleRequired: 'viewer' },
        { path: '/manage/blog', icon: FileText, label: 'Blog Posts', roleRequired: 'writer' },
        { path: '/users', icon: Users, label: 'Benutzer', roleRequired: 'admin' },
        { path: '/settings', icon: Cog, label: 'Einstellungen', roleRequired: 'admin' }
    ];

    const isActiveRoute = (path: string, exact?: boolean) => {
        if (exact) {
            return location === path;
        }
        return location.startsWith(path);
    };
    if (loading) return <Loader />

    return isAuthenticated && (
        <div className={"w-64 bg-slate-100 border-r border-slate-200 flex flex-col h-screen sticky top-0 left-0"}>
            <div className={"p-6 border-b border-slate-200"}>
                <Link href={"/"} className={"flex flex-col items-center gap-3"}>
                    {whiteLabelConfig.logo ? (
                        <Image src={whiteLabelConfig.logo.data as string} alt={whiteLabelConfig.logo.name as string} className={"h-14 w-auto"} width={500} height={500} />
                    ) : (
                        <Image src={CortexUI} alt={"CortexUI"} className={"h-10 w-auto"} />
                    )}
                    <div>
                        <h1 className={"text-slate-900 font-bold text-lg"}>
                            Admin Panel
                        </h1>
                    </div>
                </Link>
            </div>

            <nav className={"flex-1 p-4"}>
                <ul className={"space-y-2"}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActiveRoute(item.path, item.exact);

                        return getRoleValue(user?.role as string) >= getRoleValue(item.roleRequired) && (
                            <li key={item.path}>
                                <Link
                                    href={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-900 hover:bg-slate-200 hover:text-indigo-400'}`}
                                >
                                    <Icon className={"h-5 w-5"} />
                                    <span className={"font-medium"}>
                                        {item.label}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className={"p-4 border-t border-slate-200"}>
                <button
                    onClick={logout}
                    className={"cursor-pointer flex items-center gap-3 px-4 py-3 w-full text-slate-900 hover:bg-slate-200 hover:text-indigo-400 rounded-lg transition-all duration-200"}
                >
                    <LogOut className={"h-5 w-5"} />
                    <span className={"font-medium"}>
                        Abmelden
                    </span>
                </button>

                <div className={"mt-4 pt-4 border-t border-slate-200"}>
                    <Link
                        href={"/"}
                        className={"flex items-center gap-3 px-4 py-2 text-slate-900 hover:text-indigo-400 transition-colors text-sm"}
                    >
                        <Globe className={"h-4 w-4"} />
                        <span>
                            Website besuchen
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminSidebar;