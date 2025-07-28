import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Database, CheckCircle, Loader2 } from 'lucide-react';
import {SetupData} from "@/types/SetupData";
import Bus from "@/lib/bus";

interface DatabaseStepProps {
    data: SetupData;
    updateData: (stepKey: keyof SetupData, data: object) => void;
}

export const DatabaseStep: React.FC<DatabaseStepProps> = ({ data, updateData }) => {
    const [isTestingConnection, setIsTestingConnection] = useState(false);

    const updateDatabase = (field: string, value: string | boolean) => {
        if (field !== 'connectionTested') updateData('database', { connectionTested: false })
        updateData('database', { [field]: value });
    };

    const testConnection = async () => {
        setIsTestingConnection(true)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URI}/setup/test-db`, {
                method: "POST",
                headers: {
                    ContentType: "application/json; charset=UTF-8",
                },
                body: JSON.stringify({
                    uri: data.database.uri,
                    dbName: data.database.dbName,
                })
            });
            if (res.ok) {
                updateDatabase("connectionTested", true)
                Bus.emit("notification", {
                    title: "Verbindung erfolgreich",
                    message: "Die Datenbankverbindung wurde erfolgreich getestet.",
                    categoryName: "success"
                })
            } else {
                updateDatabase('connectionTested', false)
                Bus.emit("notification", {
                    title: "Verbindung fehlgeschlagen",
                    message: "Die Datenbankverbindung konnte nicht hergestellt werden.",
                    categoryName: "error"
                })
            }
        } catch {
            updateDatabase('connectionTested', false)
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
        <div className={"space-y-6"}>
            <div className={"text-center"}>
                <div className={"w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4"}>
                    <Database className={"w-8 h-8 text-indigo-500"} />
                </div>
                <h2 className={"text-xl font-semibold mb-2"}>
                    Datenbankverbindung konfigurieren
                </h2>
                <p className={"text-gray-500 text-sm"}>
                    Verbinden Sie CortexUI mit Ihrer MongoDB-Datenbank.
                </p>
            </div>

            <div className={"space-y-4"}>
                <div className={"space-y-2"}>
                    <Label htmlFor={"dbUri"}>
                        MongoDB Connection URI <span className={"text-red-500"}>*</span>
                    </Label>
                    <Input
                        id={"dbUri"}
                        placeholder={"mongodb://localhost:27017"}
                        value={data.database.uri}
                        onChange={(e) => updateDatabase('uri', e.target.value)}
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
                        value={data.database.dbName}
                        onChange={(e) => updateDatabase('dbName', e.target.value)}
                    />
                </div>

                <div className={"flex flex-col gap-3"}>
                    <Button
                        onClick={testConnection}
                        disabled={!data.database.uri || isTestingConnection}
                        variant={"outline"}
                        className={"flex items-center gap-2 self-start"}
                    >
                        {isTestingConnection ? (
                            <Loader2 className={"w-4 h-4 animate-spin"} />
                        ) : data.database.connectionTested ? (
                            <CheckCircle className={"w-4 h-4 text-lime-500"} />
                        ) : (
                            <Database className={"w-4 h-4"} />
                        )}
                        {isTestingConnection ? 'Teste Verbindung...' : 'Verbindung testen'}
                    </Button>

                    {data.database.connectionTested && !isTestingConnection && (
                        <div className={"flex items-center gap-2 text-lime-500 text-sm p-2 border border-lime-500 rounded-lg bg-lime-500/10"}>
                            <CheckCircle className={"w-4 h-4"} />
                            <span className={"text-slate-900"}>
                                Verbindung erfolgreich getestet
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {!data.database.connectionTested && !isTestingConnection && (
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
        </div>
    );
};