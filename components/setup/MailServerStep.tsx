import React, {useState} from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {Mail, Server, CheckCircle, Loader2, ExternalLink, AlertCircle} from 'lucide-react';
import {SetupData} from "@/type-definitions/SetupData";
import Bus from "@/lib/bus";
import Image from "next/image";
import Microsoft from "@/assets/Microsoft.png"

interface MailServerStepProps {
    data: SetupData;
    updateData: (stepKey: keyof SetupData, data: object) => void;
}

export const MailServerStep: React.FC<MailServerStepProps> = ({ data, updateData }) => {
    const [isTestingSmtp, setIsTestingSmtp] = useState(false);
    const [isAuthenticatingM365, setIsAuthenticatingM365] = useState(false);

    const updateMailServer = (updates: Partial<SetupData['mailServer']>) => {
        updateData('mailServer', { ...data.mailServer, ...updates });
    };

    const updateSmtp = (field: string, value: string | number | boolean) => {
        updateMailServer({
            smtp: { ...data.mailServer.smtp, [field]: value }
        });
    };

    const updateM365 = (field: string, value: string | boolean) => {
        updateMailServer({
            microsoft365: { ...data.mailServer.microsoft365, [field]: value }
        })
    };

    const testSmtpConnection = async () => {
        setIsTestingSmtp(true);

        try {
            const res = await fetch("/setup/test-smtp", {
                method: "POST",
                body: JSON.stringify({
                    host: data.mailServer.smtp?.host,
                    port: data.mailServer.smtp?.port,
                    user: data.mailServer.smtp?.username,
                    pass: data.mailServer.smtp?.password,
                    from: data.mailServer.smtp?.senderEmail,
                    fromName: data.mailServer.smtp?.senderName,
                    to: data.adminUser.email
                }),
                headers: {
                    "Content-Type": "application/json",
                }
            })
            if (res.ok) {
                updateSmtp('tested', true);
                Bus.emit("notification", {
                    title: "SMTP-Verbindung erfolgreich",
                    message: "Die E-Mail-Konfiguration wurde erfolgreich getestet.",
                    categoryName: "success"
                })
            } else {
                updateSmtp('tested', false);
                Bus.emit("notification", {
                    title: "SMTP-Verbindung fehlgeschlagen",
                    message: "Überprüfen Sie Ihre Konfiguration und versuchen Sie es erneut.",
                    categoryName: "error"
                })
            }
        } catch {
            updateSmtp('tested', false);
            Bus.emit("notification", {
                title: "SMTP-Verbindung fehlgeschlagen",
                message: "Überprüfen Sie Ihre Konfiguration und versuchen Sie es erneut.",
                categoryName: "error"
            })
        } finally {
            setIsTestingSmtp(false)
        }
    }

    const openMicrosoftPopup = () => {
        setIsAuthenticatingM365(true)
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
            `/setup/m365/popup?tenantId=${data.mailServer.microsoft365?.tenantId}&clientId=${data.mailServer.microsoft365?.clientId}&clientSecret=${data.mailServer.microsoft365?.secretKey}`,
            "Microsoft Login",
            `width=${width},height=${height},top=${top},left=${left}`
        );

        const listener = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.isOk === true) {
                updateMailServer({
                    microsoft365: { ...data.mailServer.microsoft365, authenticated: true, senderName: event.data?.displayName || "CortexUI", senderEmail: event.data?.email },
                })
                Bus.emit("notification", {
                    title: "Microsoft 365 Authentifizierung erfolgreich",
                    message: "Die Verbindung zu Microsoft 365 wurde hergestellt.",
                    categoryName: "success"
                })
                setIsAuthenticatingM365(false)
                popup?.close();
                window.removeEventListener("message", listener);
            } else if (event.data?.isOk === false) {
                updateM365('authenticated', false)
                Bus.emit("notification", {
                    title: "Microsoft 365 Authentifizierung fehlgeschlagen",
                    message: "Überprüfen Sie Ihre Microsoft 365 Konfiguration.",
                    categoryName: "error"
                })
                setIsAuthenticatingM365(false)
                popup?.close();
                window.removeEventListener("message", listener)
            }
        };
        window.addEventListener("message", listener);
    }

    return (
        <div className={"space-y-6"}>
            <div className={"text-center"}>
                <div className={"w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4"}>
                    <Mail className={"w-8 h-8 text-indigo-500"} />
                </div>
                <h2 className={"text-xl font-semibold mb-2"}>
                    E-Mail-Konfiguration
                </h2>
                <p className={"text-gray-500 text-sm"}>
                    Konfigurieren Sie Ihren SMTP-Server oder Microsoft 365 für E-Mail-Versand.
                </p>
            </div>

            <RadioGroup
                value={data.mailServer.type}
                onValueChange={(value: 'smtp' | 'microsoft365') => updateMailServer({ type: value })}
                className={"space-y-4"}
            >
                <div className={"space-y-4"}>
                    <div className={"flex items-center space-x-2"}>
                        <RadioGroupItem value={"smtp"} id={"smtp"} className={"peer"} />
                        <Label htmlFor={"smtp"} className={"flex items-center gap-2 font-medium peer-data-[state=checked]:text-indigo-500 peer-data-[state=checked]:font-semibold"}>
                            <Server className={"w-5 h-5"} />
                            <span>
                                SMTP-Verbindung
                            </span>
                        </Label>
                    </div>

                    {data.mailServer.type === 'smtp' && (
                        <div className={"ml-6 space-y-4 p-4 bg-slate-100 rounded-lg open-radio"}>
                            <div className={"grid grid-cols-1 md:grid-cols-2 gap-4"}>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"smtpHost"}>
                                        SMTP-Host <span className={"text-red-500"}>*</span>
                                    </Label>
                                    <Input
                                        id={"smtpHost"}
                                        placeholder={"smtp.cortex.ui"}
                                        value={data.mailServer.smtp?.host || ''}
                                        onChange={(e) => updateSmtp('host', e.target.value)}
                                    />
                                </div>

                                <div className={"space-y-2"}>
                                    <Label htmlFor={"smtpPort"}>
                                        Port <span className={"text-red-500"}>*</span>
                                    </Label>
                                    <Input
                                        id={"smtpPort"}
                                        type={"number"}
                                        placeholder={"587"}
                                        value={data.mailServer.smtp?.port || ''}
                                        onChange={(e) => updateSmtp('port', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className={"grid grid-cols-1 md:grid-cols-2 gap-4"}>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"smtpUsername"}>
                                        Benutzername <span className={"text-red-500"}>*</span>
                                    </Label>
                                    <Input
                                        id={"smtpUsername"}
                                        placeholder={"noreply@cortex.ui"}
                                        value={data.mailServer.smtp?.username || ''}
                                        onChange={(e) => updateSmtp('username', e.target.value)}
                                    />
                                </div>

                                <div className={"space-y-2"}>
                                    <Label htmlFor={"smtpPassword"}>
                                        Passwort <span className={"text-red-500"}>*</span>
                                    </Label>
                                    <Input
                                        id={"smtpPassword"}
                                        type={"password"}
                                        placeholder={"Passwort"}
                                        value={data.mailServer.smtp?.password || ''}
                                        onChange={(e) => updateSmtp('password', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={"grid grid-cols-1 md:grid-cols-2 gap-4"}>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"senderName"}>
                                        Absendername <span className={"text-red-500"}>*</span>
                                    </Label>
                                    <Input
                                        id={"senderName"}
                                        placeholder={"CortexUI System"}
                                        value={data.mailServer.smtp?.senderName || ''}
                                        onChange={(e) => updateSmtp('senderName', e.target.value)}
                                    />
                                </div>

                                <div className={"space-y-2"}>
                                    <Label htmlFor="senderEmail">
                                        Absender-E-Mail <span className={"text-red-500"}>*</span>
                                    </Label>
                                    <Input
                                        id={"senderEmail"}
                                        placeholder={"noreply@cortex.ui"}
                                        value={data.mailServer.smtp?.senderEmail || ''}
                                        onChange={(e) => updateSmtp('senderEmail', e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={testSmtpConnection}
                                disabled={isTestingSmtp}
                                variant={"outline"}
                                className={"flex items-center gap-2"}
                            >
                                {isTestingSmtp ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : data.mailServer.smtp?.tested ? (
                                    <CheckCircle className="w-4 h-4 text-lime-500" />
                                ) : (
                                    <Mail className="w-4 h-4" />
                                )}
                                {isTestingSmtp ? 'Teste Verbindung...' : 'SMTP-Verbindung testen'}
                            </Button>

                            {data.mailServer.smtp?.tested ? (
                                <div className={"flex items-center gap-2 text-lime-500 text-sm p-2 border border-lime-500 rounded-lg bg-lime-500/10"}>
                                    <CheckCircle className={"w-4 h-4"} />
                                    <span className={"text-slate-900"}>
                                        SMTP-Konfiguration OK.
                                    </span>
                                </div>
                            ) : (
                                <div className={"bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"}>
                                    <div className={"flex items-start gap-2"}>
                                        <AlertCircle className={"w-5 h-5 text-orange-900 mt-0.5 flex-shrink-0"} />
                                        <div>
                                            <h4 className={"font-medium text-orange-900 mb-1"}>
                                                Wichtige Information
                                            </h4>
                                            <p className={"text-sm text-orange-900"}>
                                                Um sicherzustellen, dass Ihre SMTP-Daten korrekt sind, wird eine Testmail an <code>{data.adminUser.email}</code> gesendet.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={"space-y-4"}>
                    <div className={"flex items-center space-x-2"}>
                        <RadioGroupItem value={"microsoft365"} id={"microsoft365"} className={"peer"} />
                        <Label htmlFor={"microsoft365"} className={"flex items-center gap-2 font-medium peer-data-[state=checked]:text-indigo-500 peer-data-[state=checked]:font-semibold"}>
                            <Image src={Microsoft} alt={"microsoft365"} width={260} height={260} className={"w-5 h-5"} />
                            <span>
                                Microsoft365-Konfiguration
                            </span>
                        </Label>
                    </div>

                    {data.mailServer.type === 'microsoft365' && (
                        <div className={"ml-6 space-y-4 p-4 bg-slate-100 rounded-lg open-radio"}>
                            <div className={"space-y-4"}>
                                <div className={"space-y-2"}>
                                    <Label htmlFor={"tenantId"}>
                                        Tenant ID <span className={"text-red-500"}>*</span>
                                    </Label>
                                    <Input
                                        id={"tenantId"}
                                        placeholder={"00000000-0000-0000-0000-000000000000"}
                                        value={data.mailServer.microsoft365?.tenantId || ''}
                                        onChange={(e) => updateM365('tenantId', e.target.value)}
                                    />
                                </div>

                                <div className={"space-y-2"}>
                                    <Label htmlFor={"clientId"}>
                                        Client ID <span className={"text-red-500"}>*</span>
                                    </Label>
                                    <Input
                                        id={"clientId"}
                                        placeholder={"00000000-0000-0000-0000-000000000000"}
                                        value={data.mailServer.microsoft365?.clientId || ''}
                                        onChange={(e) => updateM365('clientId', e.target.value)}
                                    />
                                </div>

                                <div className={"space-y-2"}>
                                    <Label htmlFor={"secretKey"}>
                                        Secret Key <span className={"text-red-500"}>*</span>
                                    </Label>
                                    <Input
                                        id={"secretKey"}
                                        type={"password"}
                                        placeholder={"Client Secret"}
                                        value={data.mailServer.microsoft365?.secretKey || ''}
                                        onChange={(e) => updateM365('secretKey', e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={openMicrosoftPopup}
                                disabled={isAuthenticatingM365}
                                variant={"outline"}
                                className={"flex items-center gap-2"}
                            >
                                {isAuthenticatingM365 ? (
                                    <Loader2 className={"w-4 h-4 animate-spin"} />
                                ) : data.mailServer.microsoft365?.authenticated ? (
                                    <CheckCircle className={"w-4 h-4 text-lime-500"} />
                                ) : (
                                    <Image src={Microsoft} alt={"microsoft365"} className={"w-5 h-5"} width={260} height={260} />
                                )}
                                {isAuthenticatingM365 ? 'Authentifiziere...' : 'Mit Microsoft anmelden'}
                            </Button>

                            {data.mailServer.microsoft365?.authenticated ? (
                                <div className={"flex items-center gap-2 text-lime-500 text-sm p-2 border border-lime-500 rounded-lg bg-lime-500/10"}>
                                    <CheckCircle className={"w-4 h-4"} />
                                    <span className={"text-slate-900"}>
                                        Verbindung mit Konto <span className={"text-indigo-500 font-semibold"}>{data.mailServer.microsoft365.senderName}</span>&lt;<code>{data.mailServer.microsoft365.senderEmail}</code>&gt; erfolgreich.
                                    </span>
                                </div>
                            ) : (
                                <div className={"bg-blue-500/10 border border-blue-500/30 rounded-lg p-3"}>
                                    <div className={"flex items-start gap-2"}>
                                        <ExternalLink className={"w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"} />
                                        <div className={"text-sm text-blue-900"}>
                                            <p className={"font-medium mb-1"}>
                                                Microsoft 365 API-Berechtigungen erforderlich
                                            </p>
                                            <p>
                                                Stellen Sie sicher, dass Ihre App-Registrierung die entsprechenden Mail.Send-Berechtigungen hat.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </RadioGroup>

            {data.adminUser.emailVerification && (
                <div className={"bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"}>
                    <div className={"flex items-start gap-2"}>
                        <AlertCircle className={"w-5 h-5 text-orange-900 mt-0.5 flex-shrink-0"} />
                        <div>
                            <h4 className={"font-medium text-orange-900 mb-1"}>
                                📣 E-Mail Verifizierung ist aktiv
                            </h4>
                            <p className={"text-sm text-orange-900"}>
                                Da die E-Mail Verifizierung aktiviert ist, muss eine gültige SMTP-Verbindung oder Microsoft Konfiguration hinterlegt werden.
                            </p>
                            <Button
                                onClick={() => {
                                    updateData('adminUser', { ...data.adminUser, emailVerification: false })
                                }}
                                variant={"destructive"}
                                className="mt-4"
                            >
                                Hier deaktivieren
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};