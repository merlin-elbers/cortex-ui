'use client'

import React, {useEffect, useMemo, useState} from "react";
import {Images, Save} from "lucide-react";
import { Button } from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {useAuth} from "@/context/AuthContext";
import {WhiteLabelConfig} from "@/types/WhiteLabel";
import {Textarea} from "@/components/ui/textarea";
import {deepEqual} from "@/lib/deepEqual";
import {Checkbox} from "@/components/ui/checkbox";
import Bus from "@/lib/bus";
import FileUpload from "@/components/FileUpload";
import {cleanObject} from "@/lib/cleanObject";
import {fetchWithAuth} from "@/lib/fetchWithAuth";

function normalizeWhiteLabel(config?: Partial<WhiteLabelConfig>): WhiteLabelConfig {
    return {
        title: config?.title ?? '',
        showTitle: config?.showTitle ?? false,
        subtitle: config?.subtitle ?? '',
        description: config?.description ?? '',
        contactMail: config?.contactMail ?? '',
        contactPhone: config?.contactPhone ?? '',
        contactFax: config?.contactFax ?? '',
    }
}

export default function GeneralSettings() {
    const { whiteLabelConfig, refreshWhiteLabelConfig } = useAuth()
    const [fileReset, setFileReset] = useState<boolean>(false);

    const normalizedOriginal = useMemo(
        () => normalizeWhiteLabel(whiteLabelConfig),
        [whiteLabelConfig]
    );

    const [newWhiteLabelConfig, setNewWhiteLabelConfig] = useState<WhiteLabelConfig>(normalizedOriginal);

    useEffect(() => {
        setNewWhiteLabelConfig(normalizedOriginal);
    }, [normalizedOriginal]);

    const hasChanges = useMemo(() => {
        return !deepEqual(normalizedOriginal, newWhiteLabelConfig);
    }, [normalizedOriginal, newWhiteLabelConfig]);

    const handleSubmit = async() => {
        const cleaned = cleanObject<WhiteLabelConfig>(newWhiteLabelConfig)

        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/settings/white-label`, {
            method: "PUT",
            body: JSON.stringify(cleaned)
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    Bus.emit('notification', {
                        title: 'Konfiguration gespeichert',
                        message: 'Ihre WhiteLabel Konfiguration wurde erfolgreich an den Server übermittelt',
                        categoryName: 'success'
                    })
                    refreshWhiteLabelConfig()
                    setFileReset(true)
                } else Bus.emit('notification', {
                    title: 'Konfiguration nicht gespeichert',
                    message: 'Ihre WhiteLabel Konfiguration konnte nicht vom Server verarbeitet werden',
                    categoryName: 'warning'
                })
            })
    }

    return (
        <div className={"lg:col-span-3 bg-slate-50 border border-gray-200 rounded-lg p-6"}>
            <div className={"space-y-6"}>
                <h2 className={"text-xl font-bold text-slate-900"}>
                    Allgemein
                </h2>

                <div className={"grid grid-cols-1 md:grid-cols-2 gap-6"}>
                    <div className={"space-y-2"}>
                        <Label htmlFor={"projectTitle"}>
                            Titel <span className={"text-red-500"}>*</span>
                        </Label>
                        <Input
                            id={"projectTitle"}
                            placeholder={"CortexUI"}
                            value={newWhiteLabelConfig.title}
                            onChange={(e) => setNewWhiteLabelConfig({...newWhiteLabelConfig, title: e.target.value})}
                        />
                    </div>
                    <div className={"space-y-2"}>
                        <Label htmlFor={"projectSubtitle"}>
                            Untertitel
                        </Label>
                        <Input
                            id={"projectSubtitle"}
                            placeholder={"CortexUI"}
                            value={newWhiteLabelConfig.subtitle}
                            onChange={(e) => setNewWhiteLabelConfig({...newWhiteLabelConfig, subtitle: e.target.value})}
                        />
                    </div>
                </div>

                <div className={"flex items-start space-x-3"}>
                    <Checkbox
                        id={"projectShowTitle"}
                        checked={newWhiteLabelConfig.showTitle}
                        onCheckedChange={(checked) =>  setNewWhiteLabelConfig({...newWhiteLabelConfig, showTitle: !!checked})}
                        className={"mt-1"}
                    />
                    <div className={"space-y-2"}>
                        <Label htmlFor={"projectShowTitle"} className={"font-medium"}>
                            Titel anzeigen <span className={"text-red-500"}>*</span>
                        </Label>
                        <p className={"text-xs text-gray-500"}>
                            Wenn aktiviert, wird der Titel, im Adminpanel in bestimmten Komponenten, mitgerendert
                        </p>
                    </div>
                </div>

                <div className={"space-y-2"}>
                    <Label htmlFor={"projectDescription"}>
                        Beschreibung
                    </Label>
                    <Textarea
                        id={"projectDescription"}
                        placeholder={"CortexUI"}
                        value={newWhiteLabelConfig.description}
                        onChange={(e) => setNewWhiteLabelConfig({...newWhiteLabelConfig, description: e.target.value})}
                    />
                </div>

                <div className={"grid grid-cols-1 md:grid-cols-2 gap-6"}>
                    <div className={"space-y-2"}>
                        <Label htmlFor={"projectContactMail"}>
                            Kontakt E-Mail
                        </Label>
                        <Input
                            id={"projectContactMail"}
                            type={"email"}
                            placeholder={"info@cortex.ui"}
                            value={newWhiteLabelConfig.contactMail}
                            onChange={(e) => setNewWhiteLabelConfig({...newWhiteLabelConfig, contactMail: e.target.value})}
                        />
                    </div>

                    <div className={"space-y-2"}>
                        <Label htmlFor={"projectContactPhone"}>
                            Telefon
                        </Label>
                        <Input
                            id={"projectContactPhone"}
                            placeholder={"+ 49 123 456789"}
                            value={newWhiteLabelConfig.contactPhone}
                            onChange={(e) => setNewWhiteLabelConfig({...newWhiteLabelConfig, contactPhone: e.target.value})}
                        />
                    </div>
                </div>

                <div className={"grid grid-cols-1 md:grid-cols-2 gap-6"}>
                    <div className={"space-y-2"}>
                        <Label htmlFor={"projectContactFax"}>
                            Telefax
                        </Label>
                        <Input
                            id={"projectContactFax"}
                            placeholder={"+ 49 987 654321"}
                            value={newWhiteLabelConfig.contactFax}
                            onChange={(e) => setNewWhiteLabelConfig({...newWhiteLabelConfig, contactFax: e.target.value})}
                        />
                    </div>
                </div>

                <FileUpload
                    isValidFunction={(file: File) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            setNewWhiteLabelConfig({...newWhiteLabelConfig, logo: {
                                    data: e.target?.result as string,
                                    contentType: file.type,
                                    name: file.name,
                                    lastModified: file.lastModified,
                                }})
                        };
                        reader.readAsDataURL(file)
                    }}
                    allowedExtensions={['.jpg', '.jpeg', '.png']}
                    maxFileSize={5}
                    icon={<Images className={"w-14 h-14 text-indigo-500"} /> }
                    resetFile={fileReset}
                    onFileReset={setFileReset}
                />

                {hasChanges && (
                    <Button
                        variant={"default"}
                        onClick={handleSubmit}
                    >
                        <Save className={"h-4 w-4"} />
                        <span>
                            Speichern
                        </span>
                    </Button>
                )}
            </div>
        </div>
    );
}
