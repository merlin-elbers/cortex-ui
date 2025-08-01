'use client'

import React, {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {fetchWithAuth} from "@/lib/fetchWithAuth";
import Bus from "@/lib/bus";
import {Badge} from "@/components/ui/badge";
import {BackupFile, BackupSettingsSchema} from "@/types/Backup";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {ArrowRight, Download, MoreHorizontal, Save, Trash2} from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {Input} from "@/components/ui/input";
import { deepEqual } from "@/lib/deepEqual";


const defaultBackupSettings: BackupSettingsSchema = {
    frequency: "Täglich",
    cleanUpDays: 10
}

export default function BackupSettingsPage() {
    const [data, setData] = useState<BackupSettingsSchema>(JSON.parse(JSON.stringify(defaultBackupSettings)))
    const [originalData, setOriginalData] = useState<BackupSettingsSchema>()
    const [backupStatus, setBackupStatus] = useState<boolean>(false);
    const [backupList, setBackupList] = useState<BackupFile[]>([]);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [refresh, setRefresh] = useState<boolean>(true);
    const [isModified, setIsModified] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)

    useEffect(() => {
        if (!refresh) return
        setRefresh(false)
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/backup/status`, {
            method: "GET",
        })
            .then(response => response.json())
            .then(json => setBackupStatus(json.isOk ? json.isRunning : false))
            .catch(() => {
                Bus.emit('notification', {
                    title: "Fehler beim Abruf",
                    message: "Backup Scheduler Status konnte nicht abgerufen werden",
                    categoryName: "error"
                })
                setBackupStatus(false)
            })
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/backup/list`, {
            method: "GET",
        })
            .then(res => res.json())
            .then(json => {
                setBackupList(json.isOk ? json.data : [])
                setLastBackup(json.isOk ? json.lastBackup : null)
                setData({
                    frequency: json.isOk ? json.frequency : "Täglich",
                    cleanUpDays: json.isOk ? json.cleanUpDays : 10
                })
                setOriginalData({
                    frequency: json.isOk ? json.frequency : "Täglich",
                    cleanUpDays: json.isOk ? json.cleanUpDays : 10
                })
            })
    }, [refresh]);

    useEffect(() => {
        if (originalData) {
            setIsModified(!deepEqual(data, originalData));
        }
    }, [data, originalData]);

    const handleManualBackup = async () => {
        if (isSaving) return
        setIsSaving(true)
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/backup/manually`, {
            method: "POST",
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    Bus.emit('notification', {
                        title: "Aktion erfolgreich",
                        message: json.message,
                        categoryName: "success"
                    })
                    setRefresh(true)
                }
                else Bus.emit('notification', {
                    title: "Aktion nicht erfolgreich",
                    message: json.message,
                    categoryName: "warning"
                })
            })
            .catch(() => Bus.emit('notification', {
                title: "Aktion fehlgeschlagen",
                message: "Es ist ein interner Fehler aufgetreten",
                categoryName: "error"
            }))
            .finally(() => setIsSaving(false))
    }

    const handleSchedulerStatus = async () => {
        const status = backupStatus ? "stop" : "start"
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/backup/${status}`, {
            method: "POST",
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) setBackupStatus(!backupStatus)
            })
            .catch(() => Bus.emit('notification', {
                title: "Aktion fehlgeschlagen",
                message: "Es ist ein interner Fehler aufgetreten",
                categoryName: "error"
            }))
    }

    const downloadBackup = async (fileName: string) => {
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/backup/${encodeURIComponent(fileName)}`);

        if (!response.ok) {
            Bus.emit('notification', {
                title: "Aktion fehlgeschlagen",
                message: "Es ist ein interner Fehler aufgetreten",
                categoryName: "error"
            })
            return
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }

    const deleteBackup = async (fileName: string) => {
        await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/backup/${encodeURIComponent(fileName)}`, {
            method: "DELETE"
        })
            .then(res => {
                if (res.status === 204) {
                    Bus.emit('notification', {
                        title: "Aktion erfolgreich",
                        message: "Backup erfolgreich gelöscht",
                        categoryName: "success"
                    })
                    setRefresh(true)
                } else Bus.emit('notification', {
                    title: "Aktion nicht erfolgreich",
                    message: "Aktion konnte nicht abgeschlossen werden",
                    categoryName: "warning"
                })
            })
            .catch(() => Bus.emit('notification', {
                title: "Aktion fehlgeschlagen",
                message: "Es ist ein interner Fehler aufgetreten",
                categoryName: "error"
            }))
    }

    const handleSettingsChange = async () => {

        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/backup/settings`, {
            method: "PUT",
            body: JSON.stringify(data),
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    Bus.emit('notification', {
                        title: "Aktion erfolgreich",
                        message: "Die Backupeinstellungen wurden erfolgreich gespeichert",
                        categoryName: "success"
                    })
                    setOriginalData(JSON.parse(JSON.stringify(data)))
                }
            })
            .catch(() => Bus.emit('notification', {
                title: "Aktion fehlgeschlagen",
                message: "Es ist ein interner Fehler aufgetreten",
                categoryName: "error"
            }))
    }

    return (
        <div className={"lg:col-span-3 bg-slate-50 border border-gray-200 rounded-lg p-6"}>
            <div className={"space-y-6"}>
                <h2 className={"text-xl font-bold text-slate-900"}>
                    Backup
                </h2>

                <div className={"space-y-4"}>
                    <div className={`p-4 ${backupStatus ? 'bg-green-500/10 border border-green-500/40' : 'bg-red-500/10 border border-red-500/40'} rounded-lg`}>
                        <h3 className={"text-slate-900 font-medium mb-4 flex gap-2 items-center"}>
                            Backup Scheduler
                            {backupStatus ? (
                                <Badge variant={"default"} className={"text-xs"}>
                                    aktiv
                                </Badge>
                            ) : (
                                <Badge variant={"destructive"} className={"text-xs"}>
                                    inaktiv
                                </Badge>
                            )}
                        </h3>
                        <p className={"text-gray-500 text-sm mb-4"}>
                            Letzte Sicherung: {lastBackup ? new Date(lastBackup).toLocaleString() : "n.A."}
                        </p>
                        <div className={"flex gap-3"}>
                            <Button
                                variant={"outline"}
                                onClick={handleSchedulerStatus}
                            >
                                <span>
                                    Scheduler {backupStatus ? 'stoppen' : 'starten'}
                                </span>
                            </Button>
                            <Button
                                variant={"default"}
                                onClick={handleManualBackup}
                            >
                                <span>
                                    Jetzt sichern
                                </span>
                            </Button>
                        </div>
                    </div>


                    <Table className={"my-5"}>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    Name
                                </TableHead>
                                <TableHead>
                                    Erstellt am
                                </TableHead>
                                <TableHead className={"text-right"}>
                                    Aktionen
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {backupList.length > 0 ? backupList.map((backup) => (
                                <TableRow key={backup.fileName}>
                                    <TableCell>
                                        {backup.fileName}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(backup.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell className={"text-right"}>
                                        <div className={"flex items-center justify-end gap-1"}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant={"ghost"} size={"sm"}>
                                                        <MoreHorizontal className={"h-4 w-4"} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align={"end"}>
                                                    <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                                        e.preventDefault()
                                                        downloadBackup(backup.fileName)
                                                            .then(() => console.log('download started'))
                                                    }}>
                                                        <Download className={"mr-2 h-4 w-4"} />
                                                        <span>
                                                            Download
                                                        </span>
                                                    </DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                                                                <Trash2 className={"mr-2 h-4 w-4"} />
                                                                <span>
                                                                    Löschen
                                                                </span>
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Backup löschen?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Möchten Sie das Backup &#34;{backup.fileName}&#34; vom {new Date(backup.createdAt).toLocaleString()} wirklich löschen?
                                                                    Dieser Vorgang kann <u>nicht</u> rückgängig gemacht werden.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Abbrechen
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={(e: React.MouseEvent) => {
                                                                        e.preventDefault()
                                                                        deleteBackup(backup.fileName)
                                                                            .then(() => console.log('backup deleted'))
                                                                    }}
                                                                    className={"bg-red-500 text-white hover:bg-red-500/90"}
                                                                >
                                                                    Löschen
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )): (
                                <TableRow>
                                    <TableCell colSpan={3} className={"text-center text-gray-500"}>
                                        Keine Backups gefunden
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className={"grid grid-cols-2 gap-5"}>
                        <div>
                            <Label htmlFor={"status"} className={"text-gray-500"}>
                                Zyklus
                            </Label>
                            <Select
                                value={data.frequency.toString()}
                                onValueChange={(value) => setData({...data, frequency: value})}
                            >
                                <SelectTrigger className={"bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus-visible:ring-offset-0 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={"bg-slate-50 border-slate-200 text-slate-900"}>
                                    <SelectItem value={"Täglich"}>
                                        Täglich
                                    </SelectItem>
                                    <SelectItem value={"Wöchentlich"}>
                                        Wöchentlich
                                    </SelectItem>
                                    <SelectItem value={"Monatlich"}>
                                        Monatlich
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className={"text-gray-500 text-sm mt-4"}>
                                Hinweis: <br />
                                Alle Zyklen werden morgens um 3 Uhr ausgelöst. <br />
                                Der wöchentliche Zyklus wird Sonntags ausgelöst. <br />
                                Der monatliche Zyklus wird am 1. des Monats ausgelöst
                            </p>
                        </div>
                        <div className={"space-y-2"}>
                            <Label htmlFor={"cleanUpDays"} className={"text-gray-500"}>
                                Backups automatisch löschen nach
                            </Label>
                            <div className={"grid grid-cols-2 gap-2 items-center"}>
                                <Input
                                    id={"cleanUpDays"}
                                    type={"number"}
                                    placeholder={"30"}
                                    value={data.cleanUpDays.toString()}
                                    onChange={(e) => setData({...data, cleanUpDays: parseInt(e.target.value)})}
                                />
                                <span className={"text-sm"}>
                                    Tag(en)
                                </span>
                            </div>
                            <div className={"text-gray-500 text-sm mt-4 flex flex-col"}>
                                <p>
                                    Empfohlene Werte:
                                </p>
                                <p className={"grid grid-cols-[100px_20px_auto] items-center"}>
                                    Täglich <ArrowRight className={"w-3 h-3"} /> 10-14 Tage
                                </p>
                                <p className={"grid grid-cols-[100px_20px_auto] items-center"}>
                                    Wöchentlich <ArrowRight className={"w-3 h-3"} /> 70-80 Tage
                                </p>
                                <p className={"grid grid-cols-[100px_20px_auto] items-center"}>
                                    Monatlich <ArrowRight className={"w-3 h-3"} /> 300-365 Tage
                                </p>
                            </div>
                        </div>
                    </div>
                    {isModified && (
                        <Button
                            variant={"default"}
                            disabled={isSaving}
                            onClick={handleSettingsChange}
                        >
                            <Save className={"h-4 w-4"} />
                            <span>
                            {isSaving ? 'Wird gespeichert...' : 'Speichern'}
                        </span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}