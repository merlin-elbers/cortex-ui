import React, {useEffect, useState} from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
    Search,
    Copy,
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    MoreHorizontal, Infinity, RotateCcw, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Bus from "@/lib/bus";
import {PublicKey} from "@/types/PublicKeys";
import PublicKeyForm from "@/components/settings/PublicKeyForm";
import {fetchWithAuth} from "@/lib/fetchWithAuth";


export function PublicKeySettings() {
    const [publicKeys, setPublicKeys] = useState<PublicKey[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/public-keys`, {
            method: "GET"
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) setPublicKeys(json.data)
            })
    }, [])

    const filteredPublicKeys = publicKeys.filter(key =>
        key.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const truncateKey = (key: string) => {
        return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            Bus.emit('notification', {
                title: "Kopiert",
                message: "Der Schlüssel wurde in die Zwischenablage kopiert",
                categoryName: "info"
            })
        } catch {
            Bus.emit('notification', {
                title: "Fehler beim Kopieren",
                message: "Der Schlüssel konnte nicht in die Zwischenablage kopiert werden",
                categoryName: "error"
            })
        }
    };

    const toggleActivation = async (uid: string) => {

        const key = publicKeys.find((key) => key.uid === uid)
        if (!key) return
        key.isActive =!key.isActive
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/public-keys/${uid}`, {
            method: "PUT",
            body: JSON.stringify(key)
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    Bus.emit('notification', {
                        title: "API-Schlüssel bearbeitet",
                        message: `Der Schlüssel wurde erfolgreich ${key.isActive ? 'aktiviert' : 'deaktiviert'}.`,
                        categoryName: "info"
                    })
                } else {
                    Bus.emit('notification', {
                        title: "Fehler",
                        message: "Der Schlüssel konnte nicht bearbeitet werden.",
                        categoryName: "warning"
                    })
                }
            })
            .catch(() => Bus.emit('notification', {
                title: "Fehler",
                message: "Der Schlüssel konnte nicht bearbeitet werden.",
                categoryName: "warning"
            }))
            .finally(() => {
                setPublicKeys((prevKeys) =>
                    prevKeys.map((item) =>
                        item.uid === key.uid ? key : item
                    )
                );
            })
    };

    const deletePublicKey = (uid: string) => {
        fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/public-keys/${uid}`, {
            method: "DELETE"
        })
            .then(res =>
                res.status === 204 ?
                    setPublicKeys(publicKeys.filter((key) => key.uid !== uid)) :
                    Bus.emit('notification', {
                        title: "Fehler beim Löschen",
                        message: "Der Schlüssel konnte nicht gelöscht werden.",
                        categoryName: "error"
                    })
            )

    }

    return (
        <div className={"lg:col-span-3 bg-slate-50 border border-gray-200 rounded-lg p-6"}>
            <div className={"space-y-6"}>
                <div className={"flex items-center justify-between"}>
                    <h2 className={"text-xl font-bold text-slate-900"}>
                        Öffentliche Schlüssel ({filteredPublicKeys.length})
                    </h2>
                    <div className={"flex items-center gap-2"}>
                        <div className={"relative"}>
                            <Search className={"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"} />
                            <Input
                                placeholder={"Nach Name suchen..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={"pl-9 w-64"}
                            />
                        </div>
                        <PublicKeyForm copyToClipboard={copyToClipboard} publicKeys={publicKeys} setPublicKeys={setPublicKeys} />
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                Name
                            </TableHead>
                            <TableHead>
                                Schlüssel
                            </TableHead>
                            <TableHead>
                                Status
                            </TableHead>
                            <TableHead>
                                Gültig bis
                            </TableHead>
                            <TableHead>
                                Erlaubte IPs
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
                        {filteredPublicKeys.length > 0 ? filteredPublicKeys.map((apiKey) => (
                            <TableRow key={apiKey.key} className={!apiKey.isActive ? "opacity-60" : ""}>
                                <TableCell>
                                    <div>
                                        <p className={"font-medium"}>
                                            {apiKey.name}
                                        </p>
                                        {apiKey.description && (
                                            <p className={"text-sm text-gray-500"}>
                                                {apiKey.description}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <code className={"font-mono text-sm bg-slate-100 border border-slate-200 px-2 py-1 rounded"}>
                                        {truncateKey(apiKey.key ?? '')}
                                    </code>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                                        {apiKey.isActive ? (
                                            <>
                                                <CheckCircle className={"mr-2 h-3 w-3"} />
                                                <span>
                                                    Aktiv
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className={"mr-2 h-3 w-3"} />
                                                <span>
                                                    Deaktiviert
                                                </span>
                                            </>
                                        )}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {apiKey.expiresAt ? (
                                        <div className={"flex items-center gap-2 text-sm"}>
                                            <Clock className="h-3 w-3" />
                                            {format(apiKey.expiresAt, "dd.MM.yyyy", { locale: de })}
                                        </div>
                                    ) : (
                                        <span className={"flex items-center gap-2 text-sm"}>
                                            <Infinity className={"h-3 w-3"} />
                                            <span>
                                                läuft nie ab
                                            </span>
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {apiKey.allowedIps && apiKey.allowedIps.slice(0, 2).map((ip, index) => (
                                            <Badge key={index} variant={"outline"} className={"text-xs"}>
                                                {ip === "*" ? "Keine Beschränkung" : ip}
                                            </Badge>
                                        ))}
                                        {apiKey.allowedIps &&  apiKey.allowedIps.length > 2 && (
                                            <Badge variant={"outline"} className={"text-xs"}>
                                                +{apiKey.allowedIps.length - 2}
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className={"text-sm text-gray-500"}>
                                    {format(apiKey.createdAt, "dd.MM.yyyy", { locale: de })}
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
                                                    copyToClipboard(apiKey.key ?? '').then(() => console.log('copied'))
                                                }}>
                                                    <Copy className={"mr-2 h-4 w-4"} />
                                                    <span>
                                                        Kopieren
                                                    </span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                                                    e.preventDefault()
                                                    toggleActivation(apiKey.uid ?? '')
                                                }}>
                                                    {apiKey.isActive ? (
                                                        <>
                                                            <Ban className={"mr-2 h-4 w-4"} />
                                                            <span>
                                                                Deaktivieren
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RotateCcw className={"mr-2 h-4 w-4"} />
                                                            <span>
                                                                Reaktivieren
                                                            </span>
                                                        </>
                                                    )}

                                                </DropdownMenuItem>
                                                {!apiKey.isActive && (
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
                                                                    Schlüssel löschen?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Möchten Sie den API-Schlüssel &#34;{apiKey.name}&#34; wirklich löschen?
                                                                    Dieser Vorgang kann <u>nicht</u> rückgängig gemacht werden.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Abbrechen
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => deletePublicKey(apiKey.uid ?? '')}
                                                                    className={"bg-red-500 text-white hover:bg-red-500/90"}
                                                                >
                                                                    Löschen
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className={"text-center text-gray-500"}>
                                    Keine Schlüssel gefunden
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}