'use client'

import React, { useState } from 'react';
import {Globe, Mail, Database, BarChart3, Archive} from 'lucide-react';
import {Button} from "@/components/ui/button";
import GeneralSettings from "@/components/settings/GeneralSettings";
import {SettingTabs} from "@/types/Settings";
import {useAuth} from "@/context/AuthContext";
import {redirect} from "next/navigation";

const AdminSettings = () => {
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('general');

    const tabs: SettingTabs[] = [
        { id: 'general', label: 'Allgemein', icon: Globe, component: GeneralSettings },
        { id: 'email', label: 'E-Mail', icon: Mail, component: GeneralSettings },
        { id: 'database', label: 'Datenbank', icon: Database, component: GeneralSettings },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, component: GeneralSettings },
        { id: 'backup', label: 'Backup', icon: Archive, component: GeneralSettings },
    ]

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
                <div className={"bg-slate-50 border border-slate-200 rounded-lg p-4"}>
                    <nav className={"space-y-2"}>
                        {tabs.map((tab) => (
                            <Button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
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
