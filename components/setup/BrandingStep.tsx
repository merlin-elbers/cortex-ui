import React, {useRef} from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {Palette, Upload, AlertCircle, Images} from 'lucide-react';
import {SetupData} from "@/types/SetupData";
import Image from "next/image"

interface BrandingStepProps {
    data: SetupData;
    updateData: (stepKey: keyof SetupData, data: object) => void;
}

function TextArea(props: { id: string, placeholder: string, value: string, onChange: (e) => void }) {
    return null;
}

export const BrandingStep: React.FC<BrandingStepProps> = ({ data, updateData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateBranding = (field: string, value: string | object) => {
        updateData('branding', { [field]: value });
    };

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                updateBranding('logo', {
                    data: e.target?.result as string,
                    contentType: file.type,
                    name: file.name,
                    lastModified: file.lastModified,
                });
            };
            reader.readAsDataURL(file);
        }
    }

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
                    Website Titel <span className={"text-red-500"}>*</span>
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

                <Label htmlFor={"projectSubtitle"}>
                    Untertitel
                </Label>
                <Input
                    id={"projectSubtitle"}
                    placeholder={"Innovatives, modernes und modulares Headless CMS"}
                    value={data.branding.subtitle}
                    onChange={(e) => updateBranding('subtitle', e.target.value)}
                />

                <Label htmlFor={"projectDescription"}>
                    Beschreibung
                </Label>
                <TextArea
                    id={"projectDescription"}
                    placeholder={"CortexUI ist ein hochmodernes, modulares Admin-Backend für datengetriebene Webanwendungen. Es kombiniert leistungsstarke Analytics, rollenbasiertes User Management, Content-Management und SMTP- und Microsoft365 Integration in einem leicht erweiterbaren Headless-System. Voll Open Source. Voller Fokus auf Developer Experience."}
                    value={data.branding.description ? data.branding.description : ''}
                    onChange={(e) => updateBranding('description', e.target.value)}
                />

                <Label htmlFor={"projectContactMail"}>
                    Kontakt E-Mail
                </Label>
                <Input
                    id={"projectContactMail"}
                    placeholder={"info@cortex.ui"}
                    value={data.branding.contactMail}
                    onChange={(e) => updateBranding('contactMail', e.target.value)}
                />

                <Label htmlFor={"projectContactPhone"}>
                    Telefon
                </Label>
                <Input
                    id={"projectContactPhone"}
                    placeholder={"+49 123 456789"}
                    value={data.branding.contactPhone}
                    onChange={(e) => updateBranding('contactPhone', e.target.value)}
                />

                <Label htmlFor={"projectContactFax"}>
                    Telefax
                </Label>
                <Input
                    id={"projectContactFax"}
                    placeholder={"+49 987 654321"}
                    value={data.branding.contactFax}
                    onChange={(e) => updateBranding('contactFax', e.target.value)}
                />
            </div>

            <div className={"space-y-6"}>
                <div className={"space-y-4"}>
                    <div className={"border-2 border-dashed border-gray-500/25 rounded-lg p-6 text-center space-y-4"}>
                        {data.branding.logo?.data ? (
                            <div className={"space-y-4"}>
                                <div className={"mx-auto w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden"}>
                                    <Image
                                        src={data.branding.logo.data}
                                        alt={"Logo Preview"}
                                        className={"max-w-full max-h-full object-contain"}
                                        width={500}
                                        height={500}
                                    />
                                </div>
                                <p className={"text-sm text-gray-500"}>
                                    Logo erfolgreich hochgeladen
                                </p>
                                <Button
                                    variant={"outline"}
                                    size={"sm"}
                                    onClick={() => updateBranding('logo', '')}
                                >
                                    <span>
                                        Logo entfernen
                                    </span>
                                </Button>
                            </div>
                        ) : (
                            <div className={"space-y-4"}>
                                <div className={"mx-auto w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center"}>
                                    <Images className={"w-8 h-8 text-gray-500"} />
                                </div>
                                <div>
                                    <p className={"text-sm font-semibold mb-1 text-indigo-500"}>
                                        Logo hochladen
                                    </p>
                                    <p className={"text-xs text-gray-500"}>
                                        SVG, PNG oder JPEG, max. 2MB
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button
                            variant={"outline"}
                            onClick={() => fileInputRef.current?.click()}
                            className={"flex items-center gap-2 mx-auto"}
                        >
                            <Upload className={"w-4 h-4"} />
                            <span>
                                {data.branding.logo ? 'Logo ändern' : 'Logo auswählen'}
                            </span>
                        </Button>

                        <input
                            ref={fileInputRef}
                            type={"file"}
                            accept={".svg,.png,.jpg,.jpeg"}
                            onChange={handleLogoUpload}
                            className={"hidden"}
                        />
                    </div>
                </div>

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