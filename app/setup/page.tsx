'use client'

import React, {useEffect, useState} from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {ChevronLeft, ChevronRight, CircleCheck} from 'lucide-react';
import {SetupData} from "@/type-definitions/SetupData";
import {AdminUserStep} from "@/components/setup/AdminUserStep";
import {DatabaseStep} from "@/components/setup/DatabaseStep";
import {SelfSignupStep} from "@/components/setup/SelfSignupStep";
import {BrandingStep} from "@/components/setup/BrandingStep";
import {MailServerStep} from "@/components/setup/MailServerStep";
import {AnalyticsStep} from "@/components/setup/AnalyticsStep";
import {LicenseStep} from "@/components/setup/LicenseStep";
import Image from "next/image";
import CortexUI from "@/assets/CortexUI.png"
import Bus from "@/lib/bus";
import {useAuth} from "@/context/AuthContext";
import {redirect} from "next/navigation";
import {FileUploadStep} from "@/components/setup/FileUploadStep";

const STEP_TITLES = [
    'Konfigurationsdatei',
    'Admin-Benutzer erstellen',
    'Datenbankverbindung',
    'Self-Signup',
    'Branding',
    'E-Mail-Konfiguration',
    'Analytics',
    'Lizenz & Abschluss'
];

export default function SetupWizard() {
    const { refreshSetupCompleted, refreshWhiteLabelConfig } = useAuth()
    const [currentStep, setCurrentStep] = useState(0)
    const [activateAnimation, setActivateAnimation] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [downloadConfig, setDownloadConfig] = useState<boolean>(false)
    const [passwordOK, setPasswordOK] = useState<boolean>(false)
    const [setupData, setSetupData] = useState<SetupData>({
        adminUser: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            emailVerification: false,
        },
        database: {
            uri: 'mongodb://localhost:27017',
            dbName: 'cortex-ui',
            connectionTested: false,
        },
        selfSignup: {
            enabled: false,
        },
        branding: {
            title: 'CortexUI',
        },
        mailServer: {
            type: 'smtp',
        },
        analytics: {},
        license: {
            accepted: false,
        },
    });

    const updateStepData = (stepKey: keyof SetupData, data: object) => {
        setSetupData(prev => ({
            ...prev,
            [stepKey]: { ...prev[stepKey], ...data }
        }));
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return true
            case 1:
                return setupData.adminUser.firstName && setupData.adminUser.lastName &&
                    setupData.adminUser.email && setupData.adminUser.password && passwordOK
            case 2:
                return setupData.database.uri && setupData.database.dbName && setupData.database.connectionTested
            case 4:
                return setupData.branding.title
            case 5:
                return setupData.adminUser.emailVerification ?
                    ((setupData.mailServer.type === 'smtp' && setupData.mailServer.smtp?.tested) || (setupData.mailServer.type === 'microsoft365' && setupData.mailServer.microsoft365?.authenticated)) : true
            case 6:
                const isMatomoConfigured = (!!setupData.analytics.matomoSiteId || !!setupData.analytics.matomoApiKey || !!setupData.analytics.matomoUrl)
                return isMatomoConfigured ? setupData.analytics.connectionTested : true;
            case 7:
                return setupData.license.accepted
            default:
                return true;
        }
    }

    const nextStep = () => {
        if (currentStep < STEP_TITLES.length - 1 && canProceed()) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }

    const skipToLicense = () => {
        setCurrentStep(STEP_TITLES.length - 1)
    }

    const transferConfig = async () => {
        if (isSending) return
        setIsSending(true)
        const config = {
            ...setupData,
            generatedAt: new Date().toISOString(),
            version: '1.0.0'
        };
        if (downloadConfig) {
            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'cortex-ui-config.json'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/setup/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(setupData)
            })
            const json = await response.json()
            if (json.isOk) {
                Bus.emit('notification', {
                    title: "Konfiguration erfolgreich übertragen",
                    message: "Sie werden in 3 Sekunden automatisch zum Login weitergeleitet",
                    categoryName: "success"
                })
                refreshSetupCompleted()
                refreshWhiteLabelConfig()
                setTimeout(() => {
                    redirect('/login')
                }, 3000)
            } else Bus.emit('notification', {
                title: "Fehler beim Übertragen der Konfiguration",
                message: "Überprüfen Sie die Logs des Servers oder probieren Sie es erneut",
                categoryName: "error"
            })
        } catch (error) {
            Bus.emit('notification', {
                title: "Fehler beim Übertragen der Konfiguration",
                message: `Überprüfen Sie die Logs des Servers oder probieren Sie es erneut. ${error as Error}`,
                categoryName: "error"
            })
        } finally {
            setIsSending(false);
        }
    }

    const renderStep = () => {
        const stepProps = {
            data: setupData,
            updateData: updateStepData,
        };

        switch (currentStep) {
            case 0:
                return <FileUploadStep onNext={nextStep} onSkip={skipToLicense} updateData={setSetupData} />;
            case 1:
                return <AdminUserStep onPasswordChange={setPasswordOK} {...stepProps} />;
            case 2:
                return <DatabaseStep {...stepProps} />;
            case 3:
                return <SelfSignupStep {...stepProps} />;
            case 4:
                return <BrandingStep {...stepProps} />;
            case 5:
                return <MailServerStep {...stepProps} />;
            case 6:
                return <AnalyticsStep {...stepProps} />;
            case 7:
                return <LicenseStep onDownloadChange={setDownloadConfig} downloadChange={downloadConfig} {...stepProps} />;
            default:
                return null;
        }
    };

    useEffect(() => {
        setActivateAnimation(true)
        setTimeout(() => {
            setActivateAnimation(false)
        }, 550)
    }, [currentStep]);

    const progressPercentage = ((currentStep + 1) / STEP_TITLES.length) * 100;

    return (
        <div className={"min-h-screen p-4"}>
            <div className={"max-w-2xl mx-auto"}>
                <div className={"text-center mb-8"}>
                    <div className={"flex items-center justify-center gap-2 mb-4"}>
                        <Image src={CortexUI} alt={"CortexUI"} className={"h-10 w-auto"} />
                        <h1 className={"text-2xl font-bold text-slate-900 select-none"}>
                            Setup
                        </h1>
                    </div>
                    <p className={"text-gray-500"}>
                        Schritt {currentStep + 1} von {STEP_TITLES.length}
                    </p>
                </div>

                <div className={"mb-8"}>
                    <Progress value={progressPercentage} className={"h-2"} />
                    <div className={"flex justify-between mt-2 text-xs text-gray-500"}>
                        <span>
                            Start
                        </span>
                        <span>
                            {Math.round(progressPercentage)}% abgeschlossen
                        </span>
                        <span>
                            Fertig
                        </span>
                    </div>
                </div>

                <Card className={`p-6 mb-6 ${activateAnimation ? 'fade-in' : ''}`}>
                    {renderStep()}
                </Card>

                <div className={"flex justify-between"}>
                    <Button
                        variant={"outline"}
                        onClick={prevStep}
                        className={`flex items-center gap-2 ${currentStep === 0 ? 'hidden' : ''}`}
                    >
                        <ChevronLeft className={"w-4 h-4"} />
                        <span>
                            Zurück
                        </span>
                    </Button>
                    {currentStep > 0 && (
                        currentStep === STEP_TITLES.length - 1 ? (
                            <Button
                                onClick={transferConfig}
                                disabled={!canProceed() || isSending}
                                className={"flex items-center gap-2"}
                            >
                            <span>
                                {isSending ? 'Übertrage Daten' : 'Setup abschließen'}
                            </span>
                                <CircleCheck className={"w-4 h-4"} />
                            </Button>
                        ) : (
                            <Button
                                onClick={nextStep}
                                disabled={!canProceed()}
                                className={"flex items-center gap-2 ml-auto"}
                            >
                            <span>
                                Weiter
                            </span>
                                <ChevronRight className={"w-4 h-4"} />
                            </Button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};