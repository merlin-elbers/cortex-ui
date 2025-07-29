'use client'

import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

export default function BackupSettings() {
    const [backupFrequency, setBackupFrequency] = useState<number>(0);

    return (
        <div className={"lg:col-span-3 bg-slate-50 border border-gray-200 rounded-lg p-6"}>
            <div className={"space-y-6"}>
                <h2 className={"text-xl font-bold text-slate-900"}>
                    Backup
                </h2>

                <div className={"space-y-4"}>
                    <div className={"p-4 bg-indigo-500/10 border border-indigo-500/40 rounded-lg"}>
                        <h3 className={"text-slate-900 font-medium mb-2"}>
                            Automatisches Backup
                        </h3>
                        <p className={"text-gray-500 text-sm mb-4"}>
                            Letzte Sicherung: Heute, 03:00 Uhr
                        </p>
                        <div className={"flex gap-3"}>
                            <Button
                                variant={"default"}
                            >
                                <span>
                                    Jetzt sichern
                                </span>
                            </Button>
                            <Button
                                variant={"outline"}
                            >
                                <span>
                                    Backup herunterladen
                                </span>
                            </Button>
                        </div>
                    </div>

                    <div>
                        <div>
                            <Label htmlFor={"status"} className={"text-gray-500"}>
                                Status
                            </Label>
                            <Select
                                value={backupFrequency.toString()}
                                onValueChange={(value) => setBackupFrequency(parseInt(value))}
                            >
                                <SelectTrigger className={"bg-slate-100 border border-slate-200 rounded-md text-slate-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus-visible:ring-offset-0 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className={"bg-slate-100 border-slate-200 text-slate-900"}>
                                    <SelectItem value={"0"}>
                                        Täglich
                                    </SelectItem>
                                    <SelectItem value={"1"}>
                                        Wöchentlich
                                    </SelectItem>
                                    <SelectItem value={"2"}>
                                        Monatlich
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}