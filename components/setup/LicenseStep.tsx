import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, ExternalLink } from 'lucide-react';
import {SetupData} from "@/types/SetupData";
import Link from "next/link";

interface LicenseStepProps {
    downloadChange: boolean
    onDownloadChange: (checked: boolean) => void;
    data: SetupData;
    updateData: (stepKey: keyof SetupData, data: object) => void;
}

export const LicenseStep: React.FC<LicenseStepProps> = ({ data, updateData, onDownloadChange, downloadChange }) => {
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
                            <div className={"font-semibold flex flex-col gap-1 text-right"}>
                                <span className={"font-semibold"}>
                                    {data.adminUser.firstName} {data.adminUser.lastName}
                                </span>
                                <span>
                                    {data.adminUser.email}
                                </span>
                            </div>
                        </div>
                        <div className={"flex justify-between"}>
                            <span className={"text-slate-900"}>
                                Datenbank
                            </span>
                            <div className={"font-semibold flex flex-col gap-1 text-right"}>
                                <span>
                                    {data.database.uri}
                                </span>
                                <span>
                                    {data.database.dbName}
                                </span>
                            </div>
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
                            <span className={"font-semibold"}>
                                {data.branding.title}
                            </span>
                        </div>
                        <div className={"flex justify-between"}>
                            <span className={"text-slate-900"}>
                                E-Mail-Server
                            </span>
                            <span className={`${data.mailServer.type === 'smtp' ? 'uppercase' : 'capitalize'} font-semibold`}>
                                {data.mailServer.type}
                                {(data.mailServer.type === 'smtp' && data.mailServer.smtp?.tested) || (data.mailServer.type === 'microsoft365' && data.mailServer.microsoft365?.authenticated) ?
                                    <span className={"text-lime-600 lowercase ml-1"}>konfiguriert</span> :
                                    <span className={"text-red-500 lowercase ml-1"}>nicht konfiguriert</span>
                                }
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

                    <div className={"bg-slate-100 rounded p-3 text-sm max-h-48 overflow-y-auto"}>
                        <p className={"mb-2 font-semibold"}>
                            CortexUI - Apache 2.0 License
                        </p>
                        <p className={"text-slate-900 leading-relaxed"}>
                            Apache License <br />
                            Version 2.0, January 2004 <br />
                            <Link href={"http://www.apache.org/licenses/"} target={"_blank"}>
                                http://www.apache.org/licenses/
                            </Link><br />
                            <br />
                            TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION<br />
                            <br />
                            Copyright 2025 elbers.dev<br />
                            <br />
                            Licensed under the Apache License, Version 2.0 (the &#34;License&#34;);
                            you may not use this file except in compliance with the License.
                            You may obtain a copy of the License at<br />
                            <br />
                            <Link href={"http://www.apache.org/licenses/LICENSE-2.0"} target={"_blank"}>
                                http://www.apache.org/licenses/LICENSE-2.0</Link>
                            <br />
                            <br />
                            Unless required by applicable law or agreed to in writing, software
                            distributed under the License is distributed on an &#34;AS IS&#34; BASIS,
                            WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                            See the License for the specific language governing permissions and
                            limitations under the License.
                        </p>
                    </div>

                    <Link href={'http://www.apache.org/licenses/LICENSE-2.0'} target={"_blank"}>
                        <Button
                            variant={"outline"}
                            size={"sm"}
                            className={"flex items-center gap-2"}
                        >
                            <ExternalLink className={"w-4 h-4"} />
                            <span>
                                Vollständige Lizenz anzeigen
                            </span>
                        </Button>
                    </Link>
                </div>

                <div className={"flex items-start space-x-3 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg"}>
                    <Checkbox
                        id={"selfSignupEnabled"}
                        checked={downloadChange}
                        onCheckedChange={() => onDownloadChange(!downloadChange)}
                        className={"mt-1"}
                    />
                    <div className={"space-y-2"}>
                        <Label htmlFor={"selfSignupEnabled"} className={"font-semibold text-indigo-900"}>
                            Konfigurationsdatei generieren
                        </Label>
                        <p className={"text-xs text-slate-900"}>
                            Wenn aktiviert, wird eine Konfigurationsdatei aus Ihrem bestehenden Setup erstellt.
                            Dieses können Sie nutzen, um eine zweite Instanz schnell und unkompliziert aufsetzen
                        </p>
                    </div>
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
                            um Ihre Konfiguration an den Server zu übertragen.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};