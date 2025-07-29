'use client'

import React, {useState, useEffect} from "react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {AlertCircle, CheckCircle, ExternalLink, Loader2, Mail, Save, Server} from "lucide-react";
import {Button} from "@/components/ui/button";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import Image from "next/image";
import Microsoft from "@/assets/Microsoft.png";
import {MailServer} from "@/types/Mail";
import Bus from "@/lib/bus";
import { deepEqual } from "@/lib/deepEqual";
import {useAuth} from "@/context/AuthContext";
import {fetchWithAuth} from "@/lib/fetchWithAuth";

const defaultMailServerConfig: MailServer = {
    type: 'smtp',
    microsoft365: {
        tenantId: '',
        clientId: '',
        secretKey: '',
        authenticated: false,
        senderName: '',
        senderEmail: '',
    },
    smtp: {
        host: '',
        port: 587,
        username: '',
        password: '',
        senderEmail: '',
        senderName: '',
        tested: false
    }
};

export default function MailSettings() {
    const { user } = useAuth()
    const [emailData, setEmailData] = useState<MailServer>(JSON.parse(JSON.stringify(defaultMailServerConfig)))
    const [originalEmailData, setOriginalEmailData] = useState<MailServer | null>(null);
    const [isModified, setIsModified] = useState(false);
    const [isTestingSmtp, setIsTestingSmtp] = useState(false);
    const [isAuthenticatingM365, setIsAuthenticatingM365] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/settings/mail`, {
            method: "GET"
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    setEmailData(json.data);
                    setOriginalEmailData(json.data);
                } else {
                    setOriginalEmailData(JSON.parse(JSON.stringify(defaultMailServerConfig)))
                    Bus.emit("notification", {
                        title: "Fehler beim Abruf der Daten",
                        message: "Entweder wurden keine Daten hinterlegt oder es gab einen Fehler beim Abruf",
                        categoryName: "warning"
                    });
                }
            })
            .catch(() => setOriginalEmailData(JSON.parse(JSON.stringify(defaultMailServerConfig))))
    }, []);

    useEffect(() => {
        if (originalEmailData) {
            setIsModified(!deepEqual(emailData, originalEmailData));
        }
    }, [emailData, originalEmailData]);

    const testSmtpConnection = async () => {
        setIsTestingSmtp(true);

        try {
            const res = await fetch("/setup/test-smtp", {
                method: "POST",
                body: JSON.stringify({
                    host: emailData?.smtp?.host,
                    port: emailData?.smtp?.port,
                    user: emailData?.smtp?.username,
                    pass: emailData?.smtp?.password,
                    from: emailData?.smtp?.senderEmail,
                    fromName: emailData?.smtp?.senderName,
                    to: user?.email
                }),
                headers: {
                    "Content-Type": "application/json",
                }
            })
            if (res.ok) {
                if (emailData) setEmailData({...emailData, smtp: {...emailData?.smtp, tested: true}})
                Bus.emit("notification", {
                    title: "SMTP-Verbindung erfolgreich",
                    message: "Die E-Mail-Konfiguration wurde erfolgreich getestet.",
                    categoryName: "success"
                })
            } else {
                if (emailData) setEmailData({...emailData, smtp: {...emailData?.smtp, tested: false}})
                Bus.emit("notification", {
                    title: "SMTP-Verbindung fehlgeschlagen",
                    message: "Überprüfen Sie Ihre Konfiguration und versuchen Sie es erneut.",
                    categoryName: "error"
                })
            }
        } catch {
            if (emailData) setEmailData({...emailData, smtp: {...emailData?.smtp, tested: false}})
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
            `/setup/m365/popup?tenantId=${emailData?.microsoft365?.tenantId}&clientId=${emailData?.microsoft365?.clientId}&clientSecret=${emailData?.microsoft365?.secretKey}`,
            "Microsoft Login",
            `width=${width},height=${height},top=${top},left=${left}`
        );

        const listener = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.isOk === true) {
                if (emailData) setEmailData({...emailData, microsoft365: {
                    ...emailData?.microsoft365,
                        authenticated: true,
                        senderName: event.data?.displayName || "CortexUI",
                        senderEmail: event.data?.email
                    }
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
                if (emailData) setEmailData({...emailData, microsoft365: {
                        ...emailData?.microsoft365,
                        authenticated: false
                    }
                })
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

    const handleSubmit = async () => {
        if (isSaving) return
        setIsSaving(true)
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/settings/mail`, {
            method: "POST",
            body: JSON.stringify(emailData)
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    setOriginalEmailData(JSON.parse(JSON.stringify(emailData)))
                    Bus.emit('notification', {
                        title: 'Konfiguration gespeichert',
                        message: 'Ihre E-Mail Konfiguration wurde erfolgreich an den Server übermittelt',
                        categoryName: 'success'
                    })
                } else Bus.emit('notification', {
                    title: 'Konfiguration nicht gespeichert',
                    message: 'Ihre E-Mail Konfiguration konnte nicht vom Server verarbeitet werden',
                    categoryName: 'warning'
                })
            })
            .finally(() => setIsSaving(false))
    }

    return (
        <div className={"lg:col-span-3 bg-slate-50 border border-gray-200 rounded-lg p-6"}>
            <div className={"space-y-6"}>
                <h2 className={"text-xl font-bold text-slate-900"}>
                    E-Mail
                </h2>
                <RadioGroup
                    value={emailData.type}
                    onValueChange={(value: 'smtp' | 'microsoft365') => setEmailData({...emailData, type: value})}
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

                        {emailData.type === 'smtp' && (
                            <div className={"ml-6 space-y-4 p-4 bg-slate-100 rounded-lg open-radio"}>
                                <div className={"grid grid-cols-1 md:grid-cols-2 gap-4"}>
                                    <div className={"space-y-2"}>
                                        <Label htmlFor={"smtpHost"}>
                                            SMTP-Host <span className={"text-red-500"}>*</span>
                                        </Label>
                                        <Input
                                            id={"smtpHost"}
                                            placeholder={"smtp.cortex.ui"}
                                            value={emailData.smtp?.host || ''}
                                            onChange={(e) => setEmailData({...emailData, smtp: {...emailData?.smtp, host: e.target.value}})}
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
                                            value={emailData.smtp?.port || ''}
                                            onChange={(e) => setEmailData({...emailData, smtp: {...emailData?.smtp, port: parseInt(e.target.value)}})}
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
                                            value={emailData.smtp?.username || ''}
                                            onChange={(e) => setEmailData({...emailData, smtp: {...emailData?.smtp, username: e.target.value}})}
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
                                            value={emailData.smtp?.password || ''}
                                            onChange={(e) => setEmailData({...emailData, smtp: {...emailData?.smtp, password: e.target.value}})}
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
                                            value={emailData.smtp?.senderName || ''}
                                            onChange={(e) => setEmailData({...emailData, smtp: {...emailData?.smtp, senderName: e.target.value}})}
                                        />
                                    </div>

                                    <div className={"space-y-2"}>
                                        <Label htmlFor="senderEmail">
                                            Absender-E-Mail <span className={"text-red-500"}>*</span>
                                        </Label>
                                        <Input
                                            id={"senderEmail"}
                                            placeholder={"noreply@cortex.ui"}
                                            value={emailData.smtp?.senderEmail || ''}
                                            onChange={(e) => setEmailData({...emailData, smtp: {...emailData?.smtp, senderEmail: e.target.value}})}
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
                                    ) : emailData.smtp?.tested ? (
                                        <CheckCircle className="w-4 h-4 text-lime-500" />
                                    ) : (
                                        <Mail className="w-4 h-4" />
                                    )}
                                    {isTestingSmtp ? 'Teste Verbindung...' : 'SMTP-Verbindung testen'}
                                </Button>

                                {emailData.smtp?.tested ? (
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
                                                    Um sicherzustellen, dass Ihre SMTP-Daten korrekt sind, wird eine Testmail an <code>{user?.email}</code> gesendet.
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

                        {emailData.type === 'microsoft365' && (
                            <div className={"ml-6 space-y-4 p-4 bg-slate-100 rounded-lg open-radio"}>
                                <div className={"space-y-4"}>
                                    <div className={"space-y-2"}>
                                        <Label htmlFor={"tenantId"}>
                                            Tenant ID <span className={"text-red-500"}>*</span>
                                        </Label>
                                        <Input
                                            id={"tenantId"}
                                            placeholder={"00000000-0000-0000-0000-000000000000"}
                                            value={emailData.microsoft365?.tenantId || ''}
                                            onChange={(e) => setEmailData({...emailData, microsoft365: {...emailData?.microsoft365, tenantId: e.target.value}})}
                                        />
                                    </div>

                                    <div className={"space-y-2"}>
                                        <Label htmlFor={"clientId"}>
                                            Client ID <span className={"text-red-500"}>*</span>
                                        </Label>
                                        <Input
                                            id={"clientId"}
                                            placeholder={"00000000-0000-0000-0000-000000000000"}
                                            value={emailData.microsoft365?.clientId || ''}
                                            onChange={(e) => setEmailData({...emailData, microsoft365: {...emailData?.microsoft365, clientId: e.target.value}})}
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
                                            value={emailData.microsoft365?.secretKey || ''}
                                            onChange={(e) => setEmailData({...emailData, microsoft365: {...emailData?.microsoft365, secretKey: e.target.value}})}
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
                                    ) : emailData.microsoft365?.authenticated ? (
                                        <CheckCircle className={"w-4 h-4 text-lime-500"} />
                                    ) : (
                                        <Image src={Microsoft} alt={"microsoft365"} className={"w-5 h-5"} width={260} height={260} />
                                    )}
                                    {isAuthenticatingM365 ? 'Authentifiziere...' : 'Mit Microsoft anmelden'}
                                </Button>

                                {emailData.microsoft365?.authenticated ? (
                                    <div className={"flex items-center gap-2 text-lime-500 text-sm p-2 border border-lime-500 rounded-lg bg-lime-500/10"}>
                                        <CheckCircle className={"w-4 h-4"} />
                                        <span className={"text-slate-900"}>
                                        Verbindung mit Konto <span className={"text-indigo-500 font-semibold"}>{emailData.microsoft365.senderName}</span>&lt;<code>{emailData.microsoft365.senderEmail}</code>&gt; erfolgreich.
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
                {isModified && (
                    <Button
                        variant={"default"}
                        disabled={
                            (emailData.type === "smtp" && !emailData.smtp?.tested) ||
                            (emailData.type === "microsoft365" && !emailData.microsoft365?.authenticated) ||
                            isSaving
                        }
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