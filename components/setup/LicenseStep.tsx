import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, ExternalLink, Download } from 'lucide-react';
import {SetupData} from "@/type-definitions/SetupData";

interface LicenseStepProps {
    data: SetupData;
    updateData: (stepKey: keyof SetupData, data: object) => void;
}

export const LicenseStep: React.FC<LicenseStepProps> = ({ data, updateData }) => {
    const updateLicense = (field: string, value: boolean) => {
        updateData('license', { [field]: value });
    };

    return (
        <div className={"space-y-6"}>
            <div className={"text-center"}>
                <div className={"w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4"}>
                    <CheckCircle className={"w-8 h-8 text-indigo-500"} />
                </div>
                <h2 className={"text-xl font-semibold mb-2"}>
                    Setup abschließen
                </h2>
                <p className={"text-gray-500 text-sm"}>
                    Bestätigen Sie die Lizenzbedingungen und schließen Sie das Setup ab.
                </p>
            </div>

            <div className={"space-y-6"}>
                <div className={"bg-slate-100 rounded-lg p-4"}>
                    <h4 className={"font-semibold mb-3"}>
                        Zusammenfassung
                    </h4>
                    <div className={"space-y-2 text-sm"}>
                        <div className={"flex justify-between"}>
                            <span className="text-slate-900">
                                Admin-Benutzer
                            </span>
                            <span className={"text-indigo-500 font-semibold"}>
                                {data.adminUser.firstName} {data.adminUser.lastName}
                            </span>
                        </div>
                        <div className={"flex justify-between"}>
                            <span className={"text-slate-900"}>
                                Datenbank
                            </span>
                            <span className={"text-indigo-500 font-semibold"}>
                                {data.database.dbName}
                            </span>
                        </div>
                        <div className={"flex justify-between"}>
                            <span className={"text-slate-900"}>
                                Self-Signup
                            </span>
                            <span className={`${data.selfSignup.enabled ? 'text-lime-600' : 'text-red-500'} font-semibold`}>
                                {data.selfSignup.enabled ? 'Aktiviert' : 'Deaktiviert'}
                            </span>
                        </div>
                        <div className={"flex justify-between"}>
                            <span className={"text-slate-900"}>
                                Name der App
                            </span>
                            <span className={"text-indigo-500 font-semibold"}>
                                {data.branding.title}
                            </span>
                        </div>
                        <div className={"flex justify-between"}>
                            <span className={"text-slate-900"}>
                                E-Mail-Server
                            </span>
                            <span className={"capitalize text-indigo-500 font-semibold"}>
                                {data.mailServer.type}
                            </span>
                        </div>
                        {data.analytics.matomoUrl && (
                            <div className={"flex justify-between"}>
                                <span className={"text-slate-900"}>
                                    Analytics
                                </span>
                                <span className={"text-lime-600 font-semibold"}>
                                    Matomo konfiguriert
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={"border border-indigo-500/30 rounded-lg p-4 space-y-4"}>
                    <div className={"flex items-center gap-3"}>
                        <FileText className={"w-5 h-5 text-slate-900"} />
                        <h4 className={"font-medium"}>
                            Lizenzbedingungen
                        </h4>
                    </div>

                    <div className={"bg-slate-100 rounded p-3 text-sm max-h-32 overflow-y-auto"}>
                        <p className={"mb-2 font-semibold"}>
                            CortexUI - MIT License
                        </p>
                        <p className={"text-slate-900 leading-relaxed"}>
                            Permission is hereby granted, free of charge, to any person obtaining a copy
                            of this software and associated documentation files (the &#34;Software&#34;), to deal
                            in the Software without restriction, including without limitation the rights
                            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                            copies of the Software...
                        </p>
                    </div>

                    <Button
                        variant={"outline"}
                        size={"sm"}
                        onClick={() => window.open('https://opensource.org/licenses/MIT', '_blank')}
                        className={"flex items-center gap-2"}
                    >
                        <ExternalLink className={"w-4 h-4"} />
                        <span>
                            Vollständige Lizenz anzeigen
                        </span>
                    </Button>
                </div>

                <div className={"bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"}>
                    <h4 className={"font-medium text-blue-900 mb-2"}>
                        Nach dem Setup
                    </h4>
                    <ul className={"text-sm text-blue-900 space-y-1"}>
                        <li>
                            • Starten Sie den API-Server neu
                        </li>
                        <li>
                            • Loggen Sie sich mit Ihren Admin-Daten ein
                        </li>
                    </ul>
                </div>

                <div className={"flex items-start space-x-3 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg"}>
                    <Checkbox
                        id={"licenseAccepted"}
                        checked={data.license.accepted}
                        onCheckedChange={(checked) => updateLicense('accepted', !!checked)}
                        className={"mt-1"}
                    />
                    <div className={"space-y-1"}>
                        <Label htmlFor={"licenseAccepted"} className={"font-semibold text-indigo-900"}>
                            Ich akzeptiere die Lizenzbedingungen & Nutzungsrichtlinien von CortexUI
                        </Label>
                        <p className={"text-xs text-slate-900"}>
                            Durch die Bestätigung stimmen Sie den Bedingungen der MIT-Lizenz zu.
                        </p>
                    </div>
                </div>

                {data.license.accepted && (
                    <div className={"bg-lime-500/10 border border-lime-500/30 rounded-lg p-4"}>
                        <div className={"flex items-center gap-2 mb-3"}>
                            <CheckCircle className={"w-5 h-5 text-lime-500"} />
                            <h4 className={"font-medium text-lime-900"}>
                                Bereit zum Abschluss!
                            </h4>
                        </div>
                        <p className={"text-sm text-lime-900 mb-3"}>
                            Alle Einstellungen sind konfiguriert. Klicken Sie auf &#34;Setup abschließen&#34;
                            um Ihre Konfigurationsdatei zu generieren.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};