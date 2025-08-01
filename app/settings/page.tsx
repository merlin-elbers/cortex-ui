'use client'

import React, {useEffect, useState} from 'react';
import {Globe, Mail, Database, BarChart3, Archive, KeyRound} from 'lucide-react';
import {Button} from "@/components/ui/button";
import GeneralSettings from "@/components/settings/GeneralSettings";
import {SettingTabs} from "@/types/Settings";
import {useAuth} from "@/context/AuthContext";
import {redirect, useRouter, useSearchParams} from "next/navigation";
import MailSettings from "@/components/settings/MailSettings";
import DatabaseSettings from "@/components/settings/DatabaseSettings";
import AnalyticsSettings from "@/components/settings/AnalyticsSettings";
import BackupSettings from "@/components/settings/BackupSettings";
import {PublicKeySettings} from "@/components/settings/PublicKeySettings";

const AdminSettings = () => {
    const { loading, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const searchParams = useSearchParams()
    const router = useRouter()

    const tabs: SettingTabs[] = [
        { id: 'general', label: 'Allgemein', icon: Globe, component: GeneralSettings },
        { id: 'publicKeys', label: 'Öffentliche Schlüssel', icon: KeyRound, component: PublicKeySettings },
        { id: 'email', label: 'E-Mail', icon: Mail, component: MailSettings },
        { id: 'database', label: 'Datenbank', icon: Database, component: DatabaseSettings },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, component: AnalyticsSettings },
        { id: 'backup', label: 'Backup', icon: Archive, component: BackupSettings },
    ]

    useEffect(() => {
        if (searchParams.has('view')) {
            setActiveTab(searchParams.get('view') || 'general');
        }
    }, [searchParams])

    if (loading) return null;
    if (!isAuthenticated) return redirect('/login');

    return isAuthenticated && (
        <div className={"p-6 space-y-6"}>
            <div className={"flex items-center justify-between"}>
                <div>
                    <h1 className={"text-3xl font-bold text-slate-900"}>
                        Einstellungen
                    </h1>
                    <p className={"text-gray-500 mt-1"}>
                        Konfigurieren Sie Ihre Website und Admin-Panel
                    </p>
                </div>
            </div>

            <div className={"grid grid-cols-1 lg:grid-cols-4 gap-6"}>
                <div className={"bg-slate-50 border border-slate-200 rounded-lg p-4 self-start"}>
                    <nav className={"space-y-2"}>
                        {tabs.map((tab) => (
                            <Button
                                key={tab.id}
                                onClick={() => {
                                    const params = new URLSearchParams();
                                    params.set("view", tab.id);
                                    router.replace(`?${params.toString()}`);
                                }}
                                variant={activeTab === tab.id ? "default" : "ghost"}
                                className={`w-full justify-start ${activeTab === tab.id ? 'bg-indigo-600' : ''}`}
                            >
                                <tab.icon />
                                <span className={"font-medium text-base"}>
                                    {tab.label}
                                </span>
                            </Button>
                        ))}
                    </nav>
                </div>

                {tabs.map((tab) => tab.id === activeTab ? <tab.component key={`tab-${tab.id}`} /> : null)}
            </div>
        </div>
    );
};

export default AdminSettings;
