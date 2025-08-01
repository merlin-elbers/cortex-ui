import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {Palette, AlertCircle, Images} from 'lucide-react';
import {SetupData} from "@/types/SetupData";
import {Textarea} from "@/components/ui/textarea";
import {Checkbox} from "@/components/ui/checkbox";
import FileUpload from "@/components/FileUpload";
import React, {FC} from "react";

interface BrandingStepProps {
    data: SetupData;
    updateData: (stepKey: keyof SetupData, data: object) => void;
}

export const BrandingStep: FC<BrandingStepProps> = ({ data, updateData }) => {

    const updateBranding = (field: string, value: string | object | boolean) => {
        updateData('branding', { [field]: value });
    };

    return (
        <div className={"space-y-6"}>
            <div className={"text-center"}>
                <div className={"w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4"}>
                    <Palette className={"w-8 h-8 text-indigo-500"} />
                </div>
                <h2 className={"text-xl font-semibold mb-2"}>
                    White-Label
                </h2>
                <p className={"text-gray-500 text-sm"}>
                    Personalisieren Sie das Erscheinungsbild Ihres CortexUI Dashboards.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor={"projectTitle"}>
                    Projekt-/Kundenname <span className={"text-red-500"}>*</span>
                </Label>
                <Input
                    id={"projectTitle"}
                    placeholder={"CortexUI"}
                    value={data.branding.title}
                    onChange={(e) => updateBranding('title', e.target.value)}
                />
                <p className={"text-xs text-gray-500"}>
                    Wird im Browser-Tab, auf der Login-Seite und in E-Mails verwendet.
                </p>

                <div className={"flex items-start space-x-3"}>
                    <Checkbox
                        id={"projectShowTitle"}
                        checked={data.branding.showTitle}
                        onCheckedChange={(checked) => updateBranding('showTitle', !!checked)}
                        className={"mt-1"}
                    />
                    <div className={"space-y-2"}>
                        <Label htmlFor={"selfSignupEnabled"} className={"font-medium"}>
                            Projekt-/Kundenname anzeigen
                        </Label>
                        <p className={"text-sm text-gray-500"}>
                            Wenn aktiviert, wird der Name, im Adminpanel in bestimmten Komponenten, angezeigt
                        </p>
                    </div>
                </div>

                <Label htmlFor={"projectExternalUrl"}>
                    Externe URL <span className={"text-red-500"}>*</span>
                </Label>
                <Input
                    id={"projectExternalUrl"}
                    type={"url"}
                    placeholder={"http://localhost:3000"}
                    value={data.branding.externalUrl}
                    onChange={(e) => updateBranding('externalUrl', e.target.value)}
                />
                <p className={"text-xs text-gray-500"}>
                    Die externe URL vom Ihrer CortexUI Installation
                </p>

                <Label htmlFor={"projectSubtitle"}>
                    Untertitel
                </Label>
                <Input
                    id={"projectSubtitle"}
                    placeholder={"Innovatives, modernes und modulares Headless CMS"}
                    value={data.branding.subtitle ? data.branding.subtitle : ''}
                    onChange={(e) => updateBranding('subtitle', e.target.value)}
                />

                <Label htmlFor={"projectDescription"}>
                    Beschreibung
                </Label>
                <Textarea
                    id={"projectDescription"}
                    placeholder={"CortexUI ist ein hochmodernes, modulares Admin-Backend für datengetriebene Webanwendungen. Es kombiniert leistungsstarke Analytics, rollenbasiertes User Management, Content-Management und SMTP- und Microsoft365 Integration in einem leicht erweiterbaren Headless-System. Voll Open Source. Voller Fokus auf Developer Experience."}
                    value={data.branding.description ? data.branding.description : ''}
                    className={"min-h-24"}
                    onChange={(e) => updateBranding('description', e.target.value)}
                />

                <Label htmlFor={"projectContactMail"}>
                    Kontakt E-Mail
                </Label>
                <Input
                    id={"projectContactMail"}
                    type={"email"}
                    placeholder={"info@cortex.ui"}
                    value={data.branding.contactMail ? data.branding.contactMail : ''}
                    onChange={(e) => updateBranding('contactMail', e.target.value)}
                />

                <Label htmlFor={"projectContactPhone"}>
                    Telefon
                </Label>
                <Input
                    id={"projectContactPhone"}
                    placeholder={"+49 123 456789"}
                    value={data.branding.contactPhone ? data.branding.contactPhone : ''}
                    onChange={(e) => updateBranding('contactPhone', e.target.value)}
                />

                <Label htmlFor={"projectContactFax"}>
                    Telefax
                </Label>
                <Input
                    id={"projectContactFax"}
                    placeholder={"+49 987 654321"}
                    value={data.branding.contactFax ? data.branding.contactFax : ''}
                    onChange={(e) => updateBranding('contactFax', e.target.value)}
                />
            </div>

            <FileUpload
                isValidFunction={(file: File) => {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        updateBranding('logo', {
                            data: e.target?.result as string,
                            contentType: file.type,
                            name: file.name,
                            lastModified: file.lastModified,
                        })
                    }
                    reader.readAsDataURL(file)
                }}
                allowedExtensions={['.jpg', '.jpeg', '.png']}
                maxFileSize={5}
                icon={<Images className={"w-14 h-14 text-slate-900"} /> }
            />

            <div className={"space-y-6"}>
                {data.selfSignup?.enabled && (
                    <div className={"bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"}>
                        <div className={"flex items-start gap-2"}>
                            <AlertCircle className={"w-5 h-5 text-orange-900 mt-0.5 flex-shrink-0"} />
                            <div>
                                <h4 className={"font-medium text-orange-900 mb-1"}>
                                    📣 Self-Signup ist aktiv
                                </h4>
                                <p className={"text-sm text-orange-900"}>
                                    Da Self-Signup aktiviert ist, werden Ihr Logo und Anwendungsname
                                    auf der öffentlichen Registrierungsseite angezeigt.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};