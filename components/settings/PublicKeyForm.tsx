import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Calendar, CheckCircle, Copy, Info, Key, Plus} from "lucide-react";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";
import {format} from "date-fns";
import {de} from "date-fns/locale";
import {Calendar as CalendarComponent} from "@/components/ui/calendar";
import {Switch} from "@/components/ui/switch";
import React, {useState} from "react";
import Bus from "@/lib/bus";
import {PublicKey} from "@/types/PublicKeys";
import {fetchWithAuth} from "@/lib/fetchWithAuth";

interface PublicKeyFormProps {
    copyToClipboard: (key: string) => void;
    publicKeys: PublicKey[];
    setPublicKeys: (publicKeys: PublicKey[]) => void;
}

export default function PublicKeyForm({
    copyToClipboard,
    publicKeys,
    setPublicKeys
}: PublicKeyFormProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        allowedIps: "",
        expiresAt: null as Date | null,
        isActive: true,
        metadata: "{}"
    });

    const resetCreateModal = () => {
        setIsCreateModalOpen(false);
        setNewlyCreatedKey(null);
    };

    const createApiKey = () => {
        const newApiKey: PublicKey = {
            name: formData.name,
            isActive: formData.isActive,
            expiresAt: formData.expiresAt,
            allowedIps: formData.allowedIps ? formData.allowedIps.split(/[,\n]/).map(ip => ip.trim()).filter(Boolean) : null,
            createdAt: new Date(),
            description: formData.description || undefined,
            metadata: formData.metadata ? JSON.parse(formData.metadata) : undefined
        }

        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/public-keys`, {
            method: "POST",
            body: JSON.stringify(newApiKey),
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    setPublicKeys([...publicKeys, json.publicKey]);
                    setNewlyCreatedKey(json.publicKey.key);
                    setFormData({
                        name: "",
                        description: "",
                        allowedIps: "",
                        expiresAt: null,
                        isActive: true,
                        metadata: "{}"
                    });
                    Bus.emit('notification', {
                        title: "API-Schlüssel erstellt",
                        message: "Der neue Schlüssel wurde erfolgreich erstellt.",
                        categoryName: "success"
                    })
                } else {
                    Bus.emit('notification', {
                        title: "Fehler beim Erstellen",
                        message: "Der neue Schlüssel konnte nicht erstellt werden.",
                        categoryName: "warning"
                    })
                }
            })
            .catch(() => {
                Bus.emit('notification', {
                    title: "Fehler beim Erstellen",
                    message: "Der neue Schlüssel konnte nicht erstellt werden.",
                    categoryName: "warning"
                })
            })
    }

    return (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className={"h-4 w-4"} />
                    <span>
                        Erstellen
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className={"sm:max-w-[600px] border-slate-200"}>
                <DialogHeader>
                    <DialogTitle>
                        Neuen Schlüssel erstellen
                    </DialogTitle>
                    <DialogDescription>
                        Erstellen Sie einen neuen öffentlichen Schlüssel für externe Anwendungen.
                    </DialogDescription>
                </DialogHeader>

                {newlyCreatedKey ? (
                    <div className={"space-y-4"}>
                        <div className={"p-4 bg-green-50 border border-green-200 rounded-lg"}>
                            <div className={"flex items-center gap-2 mb-2"}>
                                <CheckCircle className={"h-5 w-5 text-green-600"} />
                                <p className={"font-medium text-green-800"}>
                                    Schlüssel erfolgreich erstellt!
                                </p>
                            </div>
                            <p className={"text-sm text-green-700 mb-3"}>
                                Bitte kopieren Sie den Schlüssel jetzt. Er wird nur einmalig vollständig angezeigt.
                            </p>
                            <div className={"flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-md"}>
                                <code className={"flex-1 text-sm font-mono"}>
                                    {newlyCreatedKey}
                                </code>
                                <Button size={"sm"} variant={"outline"} onClick={() => copyToClipboard(newlyCreatedKey)}>
                                    <Copy className={"h-4 w-4"} />
                                </Button>
                            </div>
                        </div>
                        <div className={"flex justify-end"}>
                            <Button onClick={resetCreateModal}>
                                <span>
                                    Fertig
                                </span>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className={"space-y-6"}>
                        <div className={"grid grid-cols-2 gap-4"}>
                            <div className={"col-span-2"}>
                                <Label htmlFor={"keyName"}>
                                    Name <span className={"text-red-500"}>*</span>
                                </Label>
                                <Input
                                    id={"keyName"}
                                    placeholder={"z.B. Homepage"}
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className={"mt-1"}
                                />
                            </div>

                            <div className={"col-span-2"}>
                                <Label htmlFor={"keyDescription"}>
                                    Beschreibung
                                </Label>
                                <Textarea
                                    id={"keyDescription"}
                                    placeholder={"Optionale Beschreibung des Verwendungszwecks..."}
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className={"mt-1"}
                                />
                            </div>

                            <div className={"col-span-2"}>
                                <Label htmlFor={"keyAllowedIps"}>
                                    Erlaubte IP-Adressen
                                </Label>
                                <Textarea
                                    id={"keyAllowedIps"}
                                    placeholder={"178.14.239.231, 45.133.9.18 oder * für alle"}
                                    value={formData.allowedIps}
                                    onChange={(e) => setFormData(prev => ({ ...prev, allowedIps: e.target.value }))}
                                    className={"mt-1"}
                                    rows={3}
                                />
                                <p className={"text-xs text-gray-500 mt-1"}>
                                    IP-Adressen mit Kommas (,) trennen
                                </p>
                                <p className={"text-xs text-gray-500 mt-1"}>
                                    Leer lassen oder Sternchen(*) für alle IPs
                                </p>
                            </div>

                            <div>
                                <Label>
                                    Ablaufdatum
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal mt-1",
                                                !formData.expiresAt && "text-gray-500"
                                            )}
                                        >
                                            <Calendar className={"mr-2 h-4 w-4"} />
                                            {formData.expiresAt ? format(formData.expiresAt, "PPP", { locale: de }) : "Kein Ablaufdatum (∞)"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className={"w-auto p-0 border-slate-200"} align={"start"}>
                                        <CalendarComponent
                                            mode={"single"}
                                            selected={formData.expiresAt ? formData.expiresAt : new Date()}
                                            onSelect={(date: Date) => setFormData(prev => ({ ...prev, expiresAt: date }))}
                                            required={true}
                                        />
                                        <div className={"p-3 border-t border-slate-200 flex"}>
                                            <Button
                                                variant={"outline"}
                                                size={"sm"}
                                                onClick={() => setFormData(prev => ({ ...prev, expiresAt: null }))}
                                                className={"mx-auto"}
                                            >
                                                <span>
                                                    Kein Ablaufdatum
                                                </span>
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className={"flex flex-col gap-4"}>
                                <Label htmlFor={"keyIsActive"}>
                                    Schlüssel aktiviert
                                </Label>
                                <Switch
                                    id={"keyIsActive"}
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                                />
                            </div>
                        </div>

                        <div className={"flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"}>
                            <Info className={"h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"} />
                            <div className={"text-sm text-blue-800"}>
                                <p className={"font-medium mb-1"}>
                                    Wichtiger Hinweis
                                </p>
                                <p>
                                    Der vollständige API-Schlüssel wird nur einmalig nach der Erstellung angezeigt.
                                    Stellen Sie sicher, dass Sie ihn sicher speichern.
                                </p>
                            </div>
                        </div>

                        <div className={"flex justify-end gap-2"}>
                            <Button variant={"outline"} onClick={() => setIsCreateModalOpen(false)}>
                                Abbrechen
                            </Button>
                            <Button onClick={createApiKey} disabled={!formData.name.trim()}>
                                <Key className={"h-4 w-4"} />
                                <span>
                                    Erstellen
                                </span>
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}