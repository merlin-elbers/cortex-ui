import React, {useEffect, useState} from "react";
import {Analytics} from "@/types/SetupData";
import Bus from "@/lib/bus";
import {BarChart3, CheckCircle, Loader2, MoveRight, Save, Settings, TrendingUp} from "lucide-react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {fetchWithAuth} from "@/lib/fetchWithAuth";
import {deepEqual} from "@/lib/deepEqual";

const defaultAnalytics: Analytics = {
    matomoUrl: '',
    matomoSiteId: '',
    matomoApiKey: '',
}

export default function AnalyticsSettings() {
    const [isTestingConnection, setIsTestingConnection] = useState(false)
    const [data, setData] = useState<Analytics>(JSON.parse(JSON.stringify(defaultAnalytics)))
    const [originalData, setOriginalData] = useState<Analytics>()
    const [isModified, setIsModified] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)

    useEffect(() => {
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/settings/analytics`, {
            method: "GET"
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    setData(json.data)
                    setOriginalData(json.data)
                } else {
                    setOriginalData(JSON.parse(JSON.stringify(defaultAnalytics)))
                }
            })
            .catch(() => setOriginalData(JSON.parse(JSON.stringify(defaultAnalytics))))
    }, [])

    useEffect(() => {
        if (originalData) {
            setIsModified(!deepEqual(data, originalData));
        }
    }, [data, originalData]);

    const handleSubmit = async () => {
        if (isSaving || !data.connectionTested) return
        setIsSaving(true)

        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/settings/analytics`, {
            method: "POST",
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    setOriginalData(JSON.parse(JSON.stringify(data)))
                    Bus.emit('notification', {
                        title: 'Konfiguration gespeichert',
                        message: 'Ihre Matomo Konfiguration wurde erfolgreich an den Server übermittelt',
                        categoryName: 'success'
                    })
                } else Bus.emit('notification', {
                    title: 'Konfiguration nicht gespeichert',
                    message: 'Ihre Matomo Konfiguration konnte nicht vom Server verarbeitet werden',
                    categoryName: 'warning'
                })
            })
            .finally(() => setIsSaving(false))
    }

    const testConnection = async () => {
        setIsTestingConnection(true)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URI}/setup/test-matomo`, {
                method: "POST",
                headers: {
                    ContentType: "application/json; charset=UTF-8",
                },
                body: JSON.stringify({
                    matomoUrl: data.matomoUrl,
                    matomoSiteId: data.matomoSiteId,
                    matomoApiKey: data.matomoApiKey,
                })
            });
            if (res.ok) {
                setData({...data, connectionTested: true})
                Bus.emit("notification", {
                    title: "Verbindung erfolgreich",
                    message: "Die Verbindung zu Matomo wurde erfolgreich getestet.",
                    categoryName: "success"
                })
            } else {
                setData({...data, connectionTested: false})
                Bus.emit("notification", {
                    title: "Verbindung fehlgeschlagen",
                    message: "Die Verbindung zu Matomo konnte nicht hergestellt werden.",
                    categoryName: "error"
                })
            }
        } catch {
            setData({...data, connectionTested: false})
            Bus.emit("notification", {
                title: "Fehler beim Testen",
                message: "Ein unerwarteter Fehler ist aufgetreten.",
                categoryName: "warning"
            })
        } finally {
            setIsTestingConnection(false)
        }
    };

    return (
        <div className={"lg:col-span-3 bg-slate-50 border border-gray-200 rounded-lg p-6"}>
            <div className={"space-y-6"}>
                <h2 className={"text-xl font-bold text-slate-900"}>
                    Analytics
                </h2>

                <div className={"space-y-4"}>
                    <div className={"space-y-2"}>
                        <Label htmlFor={"matomoUrl"}>
                            Matomo Server URL
                        </Label>
                        <Input
                            id={"matomoUrl"}
                            placeholder={"https://analytics.cortex.ui"}
                            value={data.matomoUrl || ''}
                            onChange={(e) => setData({...data, matomoUrl: e.target.value})}
                        />
                        <p className={"text-xs text-gray-500"}>
                            Die URL zu Ihrer Matomo-Installation (ohne abschließenden Slash)
                        </p>
                    </div>

                    <div className={"space-y-2"}>
                        <Label htmlFor={"matomoSiteId"}>
                            Matomo Site-ID
                        </Label>
                        <Input
                            id={"matomoSiteId"}
                            placeholder={"1"}
                            value={data.matomoSiteId || ''}
                            onChange={(e) => setData({...data, matomoSiteId: e.target.value})}
                        />
                        <p className={"text-xs text-gray-500"}>
                            Die Site-ID aus Ihrer Matomo-Konfiguration
                        </p>
                    </div>

                    <div className={"space-y-2"}>
                        <Label htmlFor={"matomoApiKey"}>
                            Matomo API-Key
                        </Label>
                        <Input
                            type={"password"}
                            id={"matomoApiKey"}
                            placeholder={"***********"}
                            value={data.matomoApiKey || ''}
                            onChange={(e) => setData({...data, matomoApiKey: e.target.value})}
                        />
                        <p className={"text-xs text-gray-500"}>
                            Geben Sie hier den API-Schlüssel eines Matomo-Benutzers an, der Zugriff auf die gewünschte Website hat.
                        </p>
                        <p className={"text-xs text-gray-500 italic flex items-center gap-1"}>
                            <Settings className={"h-4 w-4"} />
                            <MoveRight className={"w-4 h-4"} />
                            <span>
                                Persönlich
                            </span>
                            <MoveRight className={"w-4 h-4"} />
                            <span>
                                Sicherheit
                            </span>
                            <MoveRight className={"w-4 h-4"} />
                            <span>
                                Authentifizierungstoken
                            </span>
                        </p>
                    </div>

                    <div className={"flex flex-col gap-3"}>
                        <Button
                            onClick={testConnection}
                            disabled={!data.matomoUrl || !data.matomoSiteId || !data.matomoApiKey || isTestingConnection}
                            variant={"outline"}
                            className={"flex items-center gap-2 self-start"}
                        >
                            {isTestingConnection ? (
                                <Loader2 className={"w-4 h-4 animate-spin"} />
                            ) : data.connectionTested ? (
                                <CheckCircle className={"w-4 h-4 text-lime-500"} />
                            ) : (
                                <BarChart3 className={"w-4 h-4"} />
                            )}
                            {isTestingConnection ? 'Teste Verbindung...' : 'Verbindung testen'}
                        </Button>

                        {data.connectionTested && !isTestingConnection && (
                            <div className={"bg-lime-500/10 border border-lime-500/30 rounded-lg p-4"}>
                                <div className={"flex items-center gap-2 mb-2"}>
                                    <TrendingUp className={"w-5 h-5 text-lime-500"} />
                                    <h4 className={"font-medium text-lime-900"}>
                                        Analytics erfolgreich getestet
                                    </h4>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {isModified && (
                    <Button
                        variant={"default"}
                        disabled={!data.connectionTested || isSaving}
                        onClick={handleSubmit}
                    >
                        <Save className={"h-4 w-4"} />
                        <span>
                            {isSaving ? 'Wird gespeichert...' : 'Speichern'}
                        </span>
                    </Button>
                )}
            </div>
        </div>
    );
}