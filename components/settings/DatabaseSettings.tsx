import React, {useEffect, useState} from "react";
import Bus from "@/lib/bus";
import {CheckCircle, Database, Loader2, Save} from "lucide-react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {DatabaseConfig} from "@/types/Database";
import {deepEqual} from "@/lib/deepEqual";
import DatabaseHealthCard from "@/components/DatabaseHealth";
import {fetchWithAuth} from "@/lib/fetchWithAuth";
import Loader from "@/components/Loader";

const defaultMongoDbConfig = {
    uri: "mongodb://localhost:27017",
    dbName: "cortex-ui",
    connectionTested: false,
}

export default function DatabaseSettings() {
    const [isTestingConnection, setIsTestingConnection] = useState(false)
    const [data, setData] = useState<DatabaseConfig>(JSON.parse(JSON.stringify(defaultMongoDbConfig)))
    const [originalData, setOriginalData] = useState<DatabaseConfig>()
    const [isModified, setIsModified] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)


    useEffect(() => {
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/settings/database`, {
            method: "GET"
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    setData(json.data)
                    setOriginalData(json.data)
                } else {
                    setOriginalData(JSON.parse(JSON.stringify(defaultMongoDbConfig)))
                }
            })
            .catch(() => setOriginalData(JSON.parse(JSON.stringify(defaultMongoDbConfig))))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (originalData) {
            setIsModified(!deepEqual(data, originalData));
        }
    }, [data, originalData]);

    const testConnection = async () => {
        setIsTestingConnection(true)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URI}/setup/test-db`, {
                method: "POST",
                headers: {
                    ContentType: "application/json; charset=UTF-8",
                },
                body: JSON.stringify({
                    uri: data.uri,
                    dbName: data.dbName,
                })
            });
            if (res.ok) {
                setData({...data, connectionTested: true})
                Bus.emit("notification", {
                    title: "Verbindung erfolgreich",
                    message: "Die Datenbankverbindung wurde erfolgreich getestet.",
                    categoryName: "success"
                })
            } else {
                setData({...data, connectionTested: false})
                Bus.emit("notification", {
                    title: "Verbindung fehlgeschlagen",
                    message: "Die Datenbankverbindung konnte nicht hergestellt werden.",
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

    const handleSubmit = async () => {
        if (isSaving || !data.connectionTested) return
        setIsSaving(true)

        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/settings/database`, {
            method: "PUT",
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    setOriginalData(JSON.parse(JSON.stringify(data)))
                    Bus.emit('notification', {
                        title: 'Konfiguration gespeichert',
                        message: 'Ihre Datenbank Konfiguration wurde erfolgreich an den Server übermittelt',
                        categoryName: 'success'
                    })
                } else Bus.emit('notification', {
                    title: 'Konfiguration nicht gespeichert',
                    message: 'Ihre Datenbank Konfiguration konnte nicht vom Server verarbeitet werden',
                    categoryName: 'warning'
                })
            })
            .finally(() => setIsSaving(false))
    }

    if (loading) return <Loader className={"lg:col-span-3 bg-slate-50 border border-gray-200 rounded-lg p-6 relative w-full h-full"} />

    return (
        <div className={"lg:col-span-3 bg-slate-50 border border-gray-200 rounded-lg p-6"}>
            <div className={"space-y-6"}>
                <h2 className={"text-xl font-bold text-slate-900"}>
                    Datenbank
                </h2>

                <p className="text-orange-600 font-medium mb-4 text-xs">
                    ⚠️ Achtung: Änderungen an der Datenbankverbindung greifen erst nach einem Serverneustart. Zusätzlich muss ein gültiges Backup manuell eingespielt werden.
                </p>

                <DatabaseHealthCard />

                <div className={"space-y-4"}>
                    <div className={"space-y-2"}>
                        <Label htmlFor={"dbUri"}>
                            MongoDB Connection URI <span className={"text-red-500"}>*</span>
                        </Label>
                        <Input
                            id={"dbUri"}
                            placeholder={"mongodb://localhost:27017"}
                            value={data.uri}
                            onChange={(e) => setData({...data, uri: e.target.value, connectionTested: false})}
                        />
                        <p className={"text-xs text-gray-500"}>
                            Lokale Verbindung oder MongoDB Atlas URI (mongodb+srv://...)
                        </p>
                    </div>

                    <div className={"space-y-2"}>
                        <Label htmlFor={"dbName"}>
                            Datenbankname <span className={"text-red-500"}>*</span>
                        </Label>
                        <Input
                            id={"dbName"}
                            placeholder={"cortex-ui"}
                            value={data.dbName}
                            onChange={(e) => setData({...data, dbName: e.target.value, connectionTested: false})}
                        />
                    </div>

                    <div className={"flex flex-col gap-3"}>
                        <Button
                            onClick={testConnection}
                            disabled={!data.uri || isTestingConnection}
                            variant={"outline"}
                            className={"flex items-center gap-2 self-start"}
                        >
                            {isTestingConnection ? (
                                <Loader2 className={"w-4 h-4 animate-spin"} />
                            ) : data.connectionTested ? (
                                <CheckCircle className={"w-4 h-4 text-lime-500"} />
                            ) : (
                                <Database className={"w-4 h-4"} />
                            )}
                            {isTestingConnection ? 'Teste Verbindung...' : 'Verbindung testen'}
                        </Button>

                        {data.connectionTested && !isTestingConnection && (
                            <div className={"flex items-center gap-2 text-lime-500 text-sm p-2 border border-lime-500 rounded-lg bg-lime-500/10"}>
                                <CheckCircle className={"w-4 h-4"} />
                                <span className={"text-slate-900"}>
                                    Verbindung erfolgreich getestet
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {!data.connectionTested && !isTestingConnection && (
                    <div className={"bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"}>
                        <h4 className={"font-medium text-orange-900 mb-2"}>
                            💡 Hinweise zur Datenbankverbindung
                        </h4>
                        <ul className={"text-sm text-orange-900 space-y-1"}>
                            <li>
                                • Stellen Sie sicher, dass MongoDB läuft (lokale Installation)
                            </li>
                            <li>
                                • Für MongoDB Atlas: Whitelist Ihrer IP-Adresse
                            </li>
                            <li>
                                • Verwenden Sie starke Anmeldedaten für Produktionsumgebungen
                            </li>
                        </ul>
                    </div>
                )}

                <div className={"grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"}>
                    <div className={"bg-slate-100 rounded-lg p-3"}>
                        <h5 className={"font-medium mb-1"}>
                            Lokale MongoDB
                        </h5>
                        <code className={"text-xs"}>
                            mongodb://localhost:27017
                        </code>
                    </div>
                    <div className={"bg-slate-100 rounded-lg p-3"}>
                        <h5 className={"font-medium mb-1"}>
                            MongoDB Atlas
                        </h5>
                        <code className={"text-xs"}>
                            mongodb+srv://user:pass@cluster.mongodb.net
                        </code>
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
    )
}