'use client'

import {BarChart3, FileText, Users, TrendingUp, Clock, Eye, TrendingDown} from 'lucide-react';
import {useAuth} from "@/context/AuthContext";
import {redirect} from "next/navigation";

const AdminDashboard = () => {
    const { user, isAuthenticated } = useAuth()

    const stats = [
        {
            label: "Gesamt Aufrufe",
            icon: <div className={"bg-blue-500/40 p-3 rounded-lg"}><Eye className={"h-6 w-6 text-blue-600"} /></div>,
            number: 5692,
            trend: 'UP',
            trendLabel: '9%',
        },
        {
            label: "Blog Posts",
            icon: <div className={"bg-red-500/40 p-3 rounded-lg"}><FileText className={"h-6 w-6 text-red-600"} /></div>,
            number: 23,
            trend: 'DOWN',
            trendLabel: '27%',
        },
        {
            label: "Registrierte Nutzer",
            icon: <div className={"bg-green-500/40 p-3 rounded-lg"}><Users className={"h-6 w-6 text-green-600"} /></div>,
            number: 5,
            trend: 'DOWN',
            trendLabel: '50%',
        },
        {
            label: "Conversion Rate",
            icon: <div className={"bg-purple-500/40 p-3 rounded-lg"}><BarChart3 className={"h-6 w-6 text-purple-600"} /></div>,
            number: "3.2%",
            trend: 'UP',
            trendLabel: '0.8%',
        },
    ]

    const recentActivity = [
        { id: 1, type: 'blog', title: 'Neuer Blog Post veröffentlicht', time: '2 Stunden', author: 'Admin' },
        { id: 2, type: 'visit', title: '50 neue Website Besucher', time: '4 Stunden', author: 'System' },
        { id: 3, type: 'magazin', title: 'HaitCore Artikel aktualisiert', time: '1 Tag', author: 'Editor' },
        { id: 4, type: 'service', title: 'Neue Leistung hinzugefügt', time: '2 Tage', author: 'Admin' },
    ];

    const topPages = [
        { path: '/', visits: 3421, title: 'Startseite' },
        { path: '/blog-post', visits: 1876, title: 'Blog' },
        { path: '/magazin', visits: 1654, title: 'HaitCore Magazin' },
        { path: '/leistungen', visits: 1234, title: 'Leistungen' },
        { path: '/kontakt', visits: 987, title: 'Kontakt' },
    ];

    return isAuthenticated ? (
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
                {stats.map((stat, index) => (
                    <div key={`stat-${index}`} className={"bg-slate-100 border border-slate-200 rounded-lg p-6"}>
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
                                ggü. letzten Monat
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={"grid grid-cols-1 lg:grid-cols-2 gap-6"}>
                <div className={"bg-slate-100 border border-slate-200 rounded-lg p-6"}>
                    <h2 className={"text-xl font-bold text-slate-900 mb-4"}>
                        Letzte Aktivitäten
                    </h2>
                    <div className={"space-y-4"}>
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className={"flex items-center gap-4 p-3 bg-slate-200 rounded-lg"}>
                                <div className={"bg-indigo-500/40 p-2 rounded-lg"}>
                                    <Clock className={"h-4 w-4 text-indigo-600"} />
                                </div>
                                <div className={"flex-1"}>
                                    <p className={"text-slate-900 text-sm font-medium"}>
                                        {activity.title}
                                    </p>
                                    <p className={"text-gray-500 text-xs"}>
                                        von {activity.author} • vor {activity.time}
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
                        {topPages.map((page, index) => (
                            <div key={page.path} className={"flex items-center justify-between p-3 bg-slate-200 rounded-lg"}>
                                <div className={"flex items-center gap-3"}>
                                    <span className={"text-indigo-500 font-bold text-sm"}>
                                        #{index + 1}
                                    </span>
                                    <div>
                                        <p className={"text-slate-900 text-sm font-medium"}>
                                            {page.title}
                                        </p>
                                        <p className={"text-gray-500 text-xs"}>
                                            {page.path}
                                        </p>
                                    </div>
                                </div>
                                <div className={"text-right"}>
                                    <p className={"text-slate-900 text-sm font-bold"}>
                                        {page.visits.toLocaleString()}
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
    ) : redirect('/login')
};

export default AdminDashboard;
