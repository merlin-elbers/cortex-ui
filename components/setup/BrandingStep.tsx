import React, {useEffect, useRef, useState} from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {Palette, AlertCircle, Images, CheckCircle, AlertTriangle, X} from 'lucide-react';
import {SetupData} from "@/types/SetupData";
import Image from "next/image"
import {Textarea} from "@/components/ui/textarea";
import {cn} from "@/lib/utils";
import Bus from "@/lib/bus";

interface BrandingStepProps {
    data: SetupData;
    updateData: (stepKey: keyof SetupData, data: object) => void;
}

export const BrandingStep: React.FC<BrandingStepProps> = ({ data, updateData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isValidFile, setIsValidFile] = useState<boolean | null>(null);
    const maxFileSize = 5 * 1024 * 1024;

    const updateBranding = (field: string, value: string | object) => {
        updateData('branding', { [field]: value });
    };

    const validateFile = async (file: File) => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.svg'].includes(extension) && file.size <= maxFileSize
    };

    const handleFileSelect = async (selectedFile: File) => {
        const result = await validateFile(selectedFile)
        if (result) {

            try {
                setFile(selectedFile)
                setIsValidFile(true)
                const reader = new FileReader();
                reader.onload = (e) => {
                    updateBranding('logo', {
                        data: e.target?.result as string,
                        contentType: selectedFile.type,
                        name: selectedFile.name,
                        lastModified: selectedFile.lastModified,
                    });
                };
                reader.readAsDataURL(selectedFile);
            } catch (error) {
                Bus.emit('notification', {
                    title: "Fehler beim Upload",
                    message: `Folgender Fehler ist aufgetreten: ${error}`,
                    categoryName: "error"
                })
                setIsValidFile(false)

            }
        } else {
            Bus.emit('notification', {
                title: "Ungültige Datei",
                message: `Bitte prüfen Sie, ob Ihre Datei im richtigen Format (.svg, .jpg, .jpeg, .png) und maximal 5MB groß ist.`,
                categoryName: "error"
            })
            setIsValidFile(false)
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }

    const removeFile = () => {
        setFile(null);
        setIsValidFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                <div
                    className={cn(
                        "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
                        isDragOver
                            ? "border-indigo-500 bg-indigo-500/5"
                            : "border-slate-200 hover:border-indigo-500 hover:bg-indigo-500/5",
                        file && isValidFile === false && "border-red-500 bg-red-500/5"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <input
                        ref={fileInputRef}
                        type={"file"}
                        accept={".jpg, .jpeg, .png, .svg"}
                        onChange={handleFileInputChange}
                        className={"absolute inset-0 w-full h-full opacity-0 cursor-pointer"}
                    />

                    <div className={"space-y-4"}>
                        <div className={"flex justify-center"}>
                            <Images className="w-12 h-12 text-slate-900" />
                        </div>
                        <div>
                            <p className={"text-lg font-medium text-slate-900"}>
                                Datei hierher ziehen oder klicken, um ein Logo hochzuladen
                            </p>
                            <p className={"text-sm text-gray-500 mt-2"}>
                                Unterstützte Formate: SVG, PNG, JPG (max. 5MB)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {file && (
                <div className={"p-4 bg-cyan-500/5 border border-cyan-500 rounded-lg"}>
                    <div className={"flex items-center justify-between"}>
                        <div className={"flex items-center space-x-3"}>
                            <div className={"flex items-center justify-center w-10 h-10 rounded-full"}>
                                {isValidFile === true ? (
                                    <CheckCircle className={"w-5 h-5 text-lime-600"} />
                                ) : (
                                    <AlertTriangle className={"w-5 h-5 text-red-600"} />
                                )}
                            </div>
                            {data.branding.logo &&
                                <Image
                                    src={data.branding.logo.data as string}
                                    alt={"Logo Preview"}
                                    className={"h-14 w-fit object-contain"}
                                    width={500}
                                    height={500}
                                />
                            }
                            <div>
                                <p className={"font-medium text-cyan-900"}>
                                    {file.name}
                                </p>
                                <p className={"text-sm text-gray-500"}>
                                    {formatFileSize(file.size)}
                                    {isValidFile === false && (
                                        <span className={"text-red-600 ml-2"}>
                                            • Ungültiger Dateityp oder zu groß
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant={"ghost"}
                            size={"icon"}
                            onClick={(e) => {
                                e.stopPropagation();
                                removeFile();
                            }}
                            className={"text-slate-900 hover:text-red-500 hover:bg-indigo-500/5"}
                        >
                            <X className={"w-4 h-4"} />
                        </Button>
                    </div>
                </div>
            )}

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