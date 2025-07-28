import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { UserPlus, Shield, Globe } from 'lucide-react';
import {SetupData} from "@/types/SetupData";

interface SelfSignupStepProps {
    data: SetupData;
    updateData: (stepKey: keyof SetupData, data: object) => void;
}

export const SelfSignupStep: React.FC<SelfSignupStepProps> = ({ data, updateData }) => {
    const updateSelfSignup = (field: string, value: boolean) => {
        updateData('selfSignup', { [field]: value });
    };

    return (
        <div className={"space-y-6"}>
            <div className={"text-center"}>
                <div className={"w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4"}>
                    <UserPlus className={"w-8 h-8 text-indigo-500"} />
                </div>
                <h2 className={"text-xl font-semibold mb-2"}>
                    Self-Signup konfigurieren
                </h2>
                <p className={"text-gray-500 text-sm"}>
                    Entscheiden Sie, ob sich Nutzer:innen selbst registrieren oder Nutzer:innen <u>nur</u> über das Adminpanel hinzugefügt werden können.
                </p>
            </div>

            <div className={"flex items-start space-x-3 p-6 bg-slate-100 rounded-lg"}>
                <Checkbox
                    id={"selfSignupEnabled"}
                    checked={data.selfSignup.enabled}
                    onCheckedChange={(checked) => updateSelfSignup('enabled', !!checked)}
                    className={"mt-1"}
                />
                <div className={"space-y-2"}>
                    <Label htmlFor={"selfSignupEnabled"} className={"text-base font-medium"}>
                        Öffentliche Registrierung erlauben (Self-Signup)
                    </Label>
                    <p className={"text-sm text-gray-500"}>
                        Wenn aktiviert, können sich Nutzer:innen eigenständig registrieren.
                        Die Login-Seite wird entsprechend erweitert.
                    </p>
                </div>
            </div>

            {data.selfSignup.enabled ? (
                <div className={"space-y-4"}>
                    <div className={"bg-lime-500/10 border border-lime-500/30 rounded-lg p-4"}>
                        <div className={"flex items-center gap-2 mb-2"}>
                            <Globe className={"w-5 h-5 text-lime-600"} />
                            <h4 className={"font-medium text-lime-900"}>
                                Self-Signup aktiviert
                            </h4>
                        </div>
                        <p className={"text-sm text-lime-900"}>
                            Ihre Login-Seite wird um eine Registrierungsoption erweitert.
                            Neue Benutzer erhalten standardmäßig die Rolle &#34;Viewer&#34;.
                        </p>
                    </div>

                    <div className={"grid grid-cols-1 md:grid-cols-2 gap-4"}>
                        <div className={"bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"}>
                            <h5 className={"font-medium text-blue-900 mb-2"}>
                                Vorteile
                            </h5>
                            <ul className={"text-sm text-blue-900 space-y-1"}>
                                <li>
                                    • Schnelle Benutzeronboarding
                                </li>
                                <li>
                                    • Reduzierter Administrationsaufwand
                                </li>
                                <li>
                                    • Skalierbare Benutzerverwaltung
                                </li>
                            </ul>
                        </div>

                        <div className={"bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"}>
                            <h5 className={"font-medium text-orange-900 mb-2"}>
                                Nachteile
                            </h5>
                            <ul className={"text-sm text-orange-900 space-y-1"}>
                                <li>
                                    • Spam-Registrierungen möglich
                                </li>
                                <li>
                                    • Moderation erforderlich
                                </li>
                                <li>
                                    • Datenqualität beachten
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={"bg-slate-100 border border-gray-200 rounded-lg p-4"}>
                    <div className={"flex items-center gap-2 mb-2"}>
                        <Shield className={"w-5 h-5 text-gray-500"} />
                        <h4 className={"font-medium"}>
                            Self-Signup deaktiviert
                        </h4>
                    </div>
                    <p className={"text-sm text-gray-500"}>
                        Nur Administratoren können neue Benutzer erstellen.
                        Dies bietet maximale Kontrolle über den Benutzerzugang.
                    </p>
                </div>
            )}

            <div className={"bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4"}>
                <h4 className={"font-medium text-indigo-900 mb-2"}>
                    💡 Empfehlung
                </h4>
                <p className={"text-sm text-indigo-900"}>
                    Für Entwicklungs- und Testumgebungen empfehlen wir Self-Signup zu aktivieren.
                    Für Produktionsumgebungen sollten Sie je nach Anwendungsfall entscheiden.
                </p>
            </div>
        </div>
    );
};