'use client'

import {
    TrendingUp,
    Clock,
    Eye,
    TrendingDown,
    CornerUpLeft,
    Activity,
    BarChart2, MousePointerClick, Search, Globe, Share2
} from 'lucide-react';
import {useAuth} from "@/context/AuthContext";
import {redirect} from "next/navigation";
import React, {useEffect, useState} from "react";
import {MatomoAnalytics} from "@/types/Matomo";
import Loader from "@/components/Loader";

const AdminDashboard = () => {
    const { user, isAuthenticated, serverStatus, loading } = useAuth()
    const [analytics, setAnalytics] = useState<MatomoAnalytics | null>(null)

    useEffect(() => {
        if (serverStatus.matomoConfigured) {
            fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/analytics/matomo`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`
                }
            })
                .then(res => res.json())
                .then(json => {
                    if (json.isOk) {
                        for (const entry of json.data.summary) {
                            if (entry.label.toLowerCase().includes('aufrufe')) entry.icon = <div className={"bg-blue-500/40 p-3 rounded-lg"}><Eye className={"h-6 w-6 text-blue-600"} /></div>
                            else if (entry.label.toLowerCase().includes('bounce')) entry.icon = <div className={"bg-red-500/40 p-3 rounded-lg"}><CornerUpLeft className={"h-6 w-6 text-red-600"} /></div>
                            else if (entry.label.toLowerCase().includes('aktionen')) entry.icon = <div className={"bg-green-500/40 p-3 rounded-lg"}><Activity className={"h-6 w-6 text-green-600"} /></div>
                            else if (entry.label.toLowerCase().includes('zeit')) entry.icon = <div className={"bg-purple-500/40 p-3 rounded-lg"}><Clock className={"h-6 w-6 text-purple-600"} /></div>
                            else entry.icon = <div className={"bg-indigo-500/40 p-3 rounded-lg"}><BarChart2 className={"h-6 w-6 text-indigo-600"} /></div>
                        }
                        for (const entry of json.data.topReferrers) {
                            if (entry.label.toLowerCase().includes('direct')) entry.icon = <div className={"bg-blue-500/40 p-2 rounded-lg"}><MousePointerClick className={"h-5 w-5 text-blue-600"} /></div>
                            else if (entry.label.toLowerCase().includes('search')) entry.icon = <div className={"bg-red-500/40 p-2 rounded-lg"}><Search className={"h-5 w-5 text-red-600"} /></div>
                            else if (entry.label.toLowerCase().includes('websites')) entry.icon = <div className={"bg-green-500/40 p-2 rounded-lg"}><Globe className={"h-5 w-5 text-green-600"} /></div>
                            else if (entry.label.toLowerCase().includes('social')) entry.icon = <div className={"bg-purple-500/40 p-2 rounded-lg"}><Share2 className={"h-5 w-5 text-purple-600"} /></div>
                            else entry.icon = <div className={"bg-indigo-500/40 p-2 rounded-lg"}><BarChart2 className={"h-5 w-5 text-indigo-600"} /></div>
                        }
                        setAnalytics({...json.data})
                    }
                })
        }
    }, [serverStatus]);

    function formatTime(seconds: number) {
        if (seconds >= 60) {
            const min = Math.floor(seconds / 60);
            const sec = seconds % 60;
            return `${min}m ${sec}s`;
        }
        return `${seconds}s`;
    }

    if (loading) return <Loader />
    if (!isAuthenticated) return redirect('/login')

    return (
        <div className={"p-6 space-y-6"}>

            <div className={"flex items-center justify-between"}>
                <div>
                    <h1 className={"text-3xl font-bold text-slate-900"}>
                        Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Willkommen zurück {user?.firstName}! Hier ist eine Übersicht Ihrer Website.
                    </p>
                </div>
            </div>

            <div className={"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"}>
                {analytics && analytics.summary.map((stat, index) => (
                    <div key={`stat-${index}`} className={`${stat.trend === 'UP' ? 'bg-slate-50' : 'bg-slate-100'} border border-slate-200 rounded-lg p-6`}>
                        <div className={"flex items-center justify-between"}>
                            <div>
                                <p className={"text-slate-900 text-sm"}>
                                    {stat.label}
                                </p>
                                <p className={"text-2xl font-bold text-indigo-500"}>
                                    {stat.number}
                                </p>
                            </div>
                            {stat.icon}
                        </div>
                        <div className={"flex items-center mt-4 text-sm"}>
                            {stat.trend === 'UP' && (
                                <TrendingUp className={"h-4 w-4 text-green-600 mr-1"} />
                            )}
                            {stat.trend === 'DOWN' && (
                                <TrendingDown className={"h-4 w-4 text-red-600 mr-1"} />
                            )}
                            <span className={stat.trend === 'UP' ? "text-green-600" : "text-red-600"}>
                                {stat.trendLabel}
                            </span>
                            <span className={"text-gray-500 ml-1"}>
                                gegenüber der Vorwoche
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={"grid grid-cols-1 lg:grid-cols-2 gap-6"}>
                <div className={"bg-slate-100 border border-slate-200 rounded-lg p-6"}>
                    <h2 className={"text-xl font-bold text-slate-900 mb-4"}>
                        Trafficquellen
                    </h2>
                    <div className={"space-y-3"}>
                        {analytics && analytics.topReferrers.map((referrer) => (
                            <div key={referrer.label} className={"flex items-center justify-between p-3 bg-slate-200 rounded-lg"}>
                                <div className={"flex items-center gap-3"}>
                                    {referrer.icon}
                                    <div>
                                        <p className={"text-slate-900 text-sm font-semibold capitalize"}>
                                            {referrer.label}
                                        </p>
                                        <p className={"text-gray-500 text-xs"}>
                                            Ø Aufenthaltsdauer {formatTime(referrer.averageSessionLengthLastWeek)}
                                        </p>
                                    </div>
                                </div>
                                <div className={"text-right"}>
                                    <p className={"text-slate-900 text-sm font-bold"}>
                                        {referrer.visitsLastWeek}
                                    </p>
                                    <p className={"text-gray-500 text-xs"}>
                                        Aufrufe
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={"bg-slate-100 border border-slate-200 rounded-lg p-6"}>
                    <h2 className={"text-xl font-bold text-slate-900 mb-4"}>
                        Meistbesuchte Seiten
                    </h2>
                    <div className={"space-y-3"}>
                        {analytics && analytics.topPages.map((page, index) => (
                            <div key={page.url} className={"flex items-center justify-between p-3 bg-slate-200 rounded-lg"}>
                                <div className={"flex items-center gap-3"}>
                                    <span className={"text-indigo-500 font-bold text-base"}>
                                        #{index + 1}
                                    </span>
                                    <div>
                                        <p className={"text-slate-900 text-sm font-semibold capitalize"}>
                                            {page.url.replace('/', '').replaceAll('-', ' ')} <span className={"font-medium text-gray-500 lowercase"}>({page.url})</span>
                                        </p>
                                        <p className={"text-gray-500 text-xs"}>
                                            Ø Ladezeit {formatTime(page.averageLoadTimeLastWeek)}
                                        </p>
                                    </div>
                                </div>
                                <div className={"text-right"}>
                                    <p className={"text-slate-900 text-sm font-bold"}>
                                        {page.visitsLastWeek}
                                    </p>
                                    <p className={"text-gray-500 text-xs"}>
                                        Aufrufe
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
};

export default AdminDashboard;
