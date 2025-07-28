'use client'

import {useState} from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {BarChart3, TrendingUp, Shield, Settings, MoveRight, Loader2, CheckCircle} from 'lucide-react';
import {SetupData} from "@/types/SetupData";
import {Button} from "@/components/ui/button";
import Bus from "@/lib/bus";

interface AnalyticsStepProps {
    data: SetupData;
    updateData: (stepKey: keyof SetupData, data: object) => void;
}

export const AnalyticsStep: React.FC<AnalyticsStepProps> = ({ data, updateData }) => {
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const updateAnalytics = (field: string, value: string | boolean) => {
        updateData('analytics', { [field]: value });
    };

    const testConnection = async () => {
        setIsTestingConnection(true)

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URI}/setup/test-matomo`, {
                method: "POST",
                headers: {
                    ContentType: "application/json; charset=UTF-8",
                },
                body: JSON.stringify({
                    matomoUrl: data.analytics.matomoUrl,
                    matomoSiteId: data.analytics.matomoSiteId,
                    matomoApiKey: data.analytics.matomoApiKey,
                })
            });
            if (res.ok) {
                updateAnalytics("connectionTested", true)
                Bus.emit("notification", {
                    title: "Verbindung erfolgreich",
                    message: "Die Verbindung zu Matomo wurde erfolgreich getestet.",
                    categoryName: "success"
                })
            } else {
                updateAnalytics('connectionTested', false)
                Bus.emit("notification", {
                    title: "Verbindung fehlgeschlagen",
                    message: "Die Verbindung zu Matomo konnte nicht hergestellt werden.",
                    categoryName: "error"
                })
            }
        } catch {
            updateAnalytics('connectionTested', false)
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
                    <BarChart3 className={"w-8 h-8 text-indigo-500"} />
                </div>
                <h2 className={"text-xl font-semibold mb-2"}>
                    Analytics-Konfiguration (optional)
                </h2>
                <p className={"text-gray-500 text-sm"}>
                    Verbinden Sie Matomo für die optimale und datenschutzfreundliche Webanalyse.
                </p>
            </div>

            <div className={"space-y-6"}>
                <div className={"bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"}>
                    <div className={"flex items-start gap-3"}>
                        <Shield className={"w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"} />
                        <div>
                            <h4 className={"font-medium text-slate-900 mb-1"}>
                                Warum Matomo?
                            </h4>
                            <p className={"text-sm text-slate-900"}>
                                Matomo ist eine datenschutzfreundliche Alternative zu Google Analytics,
                                die vollständig DSGVO-konform betrieben werden kann.
                            </p>
                        </div>
                    </div>
                </div>

                <div className={"space-y-4"}>
                    <div className={"space-y-2"}>
                        <Label htmlFor={"matomoUrl"}>
                            Matomo Server URL
                        </Label>
                        <Input
                            id={"matomoUrl"}
                            placeholder={"https://analytics.cortex.ui"}
                            value={data.analytics.matomoUrl || ''}
                            onChange={(e) => updateAnalytics('matomoUrl', e.target.value)}
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
                            value={data.analytics.matomoSiteId || ''}
                            onChange={(e) => updateAnalytics('matomoSiteId', e.target.value)}
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
                            value={data.analytics.matomoApiKey || ''}
                            onChange={(e) => updateAnalytics('matomoApiKey', e.target.value)}
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
                            disabled={!data.analytics.matomoUrl || !data.analytics.matomoSiteId || !data.analytics.matomoApiKey || isTestingConnection}
                            variant={"outline"}
                            className={"flex items-center gap-2 self-start"}
                        >
                            {isTestingConnection ? (
                                <Loader2 className={"w-4 h-4 animate-spin"} />
                            ) : data.analytics.connectionTested ? (
                                <CheckCircle className={"w-4 h-4 text-lime-500"} />
                            ) : (
                                <BarChart3 className={"w-4 h-4"} />
                            )}
                            {isTestingConnection ? 'Teste Verbindung...' : 'Verbindung testen'}
                        </Button>

                        {data.analytics.connectionTested && !isTestingConnection && (
                            <div className={"bg-lime-500/10 border border-lime-500/30 rounded-lg p-4"}>
                                <div className={"flex items-center gap-2 mb-2"}>
                                    <TrendingUp className={"w-5 h-5 text-lime-500"} />
                                    <h4 className={"font-medium text-lime-900"}>
                                        Analytics erfolgreich getestet
                                    </h4>
                                </div>
                                <p className={"text-sm text-lime-900"}>
                                    Matomo-Tracking wird in Ihrer CortexUI-Installation aktiviert.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={"bg-slate-100 rounded-lg p-4"}>
                    <h4 className={"font-medium mb-3"}>
                        Funktionen mit Analytics
                    </h4>
                    <ul className={"text-sm text-gray-500 space-y-2"}>
                        <li className={"flex items-center gap-2"}>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span>
                                Benutzerverhalten und Seitenaufrufe verfolgen
                            </span>
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span>
                                Dashboard-Nutzungsstatistiken
                            </span>
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span>
                                Performance-Monitoring
                            </span>
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span>
                                DSGVO-konforme Datenerhebung
                            </span>
                        </li>
                    </ul>
                </div>

                <div className={"bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"}>
                    <h4 className={"font-medium text-orange-900 mb-2"}>
                        💡 Hinweis
                    </h4>
                    <p className="text-sm text-orange-900">
                        Analytics ist vollständig optional. Sie können CortexUI auch ohne
                        Tracking-Funktionen betreiben oder diese später hinzufügen.
                    </p>
                </div>
            </div>
        </div>
    );
};