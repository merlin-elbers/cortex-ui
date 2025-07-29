import React, { useEffect, useState } from "react";
import {
    AlertCircle,
    CircleDot,
    Clock,
    HardDrive,
    Info,
    List,
    Users,
    Zap,
} from "lucide-react";
import {DatabaseHealth} from "@/types/System";

const getLatencyColor = (latency: number) => {
    if (latency < 50) return "text-green-600";
    if (latency < 150) return "text-yellow-600";
    return "text-red-600";
};

export default function DatabaseHealthCard() {
    const [databaseHealth, setDatabaseHealth] = useState<DatabaseHealth | null>(null);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/database-health`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            },
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.isOk) setDatabaseHealth(json.data);
                else {
                    setDatabaseHealth({
                        dbName: "Unbekannt",
                        serverVersion: "-",
                        uptimeSeconds: 0,
                        connectionCount: 0,
                        indexes: "-",
                        storageSizeMB: 0,
                        latencyMs: 9999,
                    });
                }
            });
    }, []);

    if (!databaseHealth) return null;

    const status = databaseHealth.latencyMs < 1000 ? "online" : "offline";
    const uptime = `${Math.floor(databaseHealth.uptimeSeconds / 3600)}h ${Math.floor((databaseHealth.uptimeSeconds % 3600) / 60)}m`;

    return (
        <section className={"bg-slate-50 border-y border-y-gray-200 py-4"}>
            <div className={"mb-6"}>
                <div className={"flex items-center gap-2"}>
                    <span className={"text-sm font-medium text-slate-700"}>
                        Status:
                    </span>
                    {status === "online" ? (
                        <div className={"flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-700 rounded-full text-sm font-medium"}>
                            <CircleDot className={"w-3 h-3"} />
                            <span>
                                Online
                            </span>
                        </div>
                    ) : (
                        <div className={"flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-600 rounded-full text-sm font-medium"}>
                            <AlertCircle className={"w-3 h-3"} />
                            <span>
                                Offline
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className={"grid grid-cols-1 md:grid-cols-2 gap-6"}>
                <InfoCard icon={<Clock className={"w-5 h-5 text-slate-500"} />} label="Uptime" value={uptime} />
                <InfoCard icon={<Zap className={"w-5 h-5 text-slate-500"} />} label="Latency" value={`${databaseHealth.latencyMs}ms`} valueClass={getLatencyColor(databaseHealth.latencyMs)} />
                <InfoCard icon={<Users className={"w-5 h-5 text-slate-500"} />} label="Active Connections" value={databaseHealth.connectionCount} />
                <InfoCard icon={<HardDrive className={"w-5 h-5 text-slate-500"} />} label="Storage Used" value={`${databaseHealth.storageSizeMB} MB`} />
                <InfoCard icon={<List className={"w-5 h-5 text-slate-500"} />} label="Index Count" value={databaseHealth.indexes} />
                <InfoCard icon={<Info className={"w-5 h-5 text-slate-500"} />} label="MongoDB Version" value={databaseHealth.serverVersion} />
            </div>
        </section>
    );
}

function InfoCard({ icon, label, value, valueClass = "text-slate-900" }: { icon: React.ReactNode; label: string; value: string | number; valueClass?: string }) {
    return (
        <div className={"flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200"}>
            {icon}
            <div>
                <div className={"text-sm text-slate-600"}>
                    {label}
                </div>
                <div className={`text-base font-semibold ${valueClass}`}>
                    {value}
                </div>
            </div>
        </div>
    );
}
