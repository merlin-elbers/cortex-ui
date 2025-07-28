import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {Upload, FileText, X, CheckCircle, AlertTriangle, Rocket} from 'lucide-react';
import { cn } from '@/lib/utils';
import Bus from "@/lib/bus";
import {SetupDataZod} from "@/types/SetupDataZod";
import {SetupData} from "@/types/SetupData";

interface FileUploadStepProps {
    onNext: () => void;
    onSkip: () => void;
    updateData: (data: SetupData) => void;
}

export const FileUploadStep: React.FC<FileUploadStepProps> = ({ onNext, updateData, onSkip }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isValidFile, setIsValidFile] = useState<boolean | null>(null);
    const [configLoaded, setConfigLoaded] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxFileSize = 2 * 1024 * 1024;

    const validateFile = async (file: File): Promise<boolean> => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        const valid = ['.json'].includes(extension) && file.size <= maxFileSize
        if (!valid) {
            return false
        }
        const validationResult = SetupDataZod.safeParse(JSON.parse(await file.text()))
        return validationResult.success;
    };

    const handleFileSelect = async (selectedFile: File) => {
        const result = await validateFile(selectedFile)
        if (result) {

            try {
                setFile(selectedFile)
                setIsValidFile(true)
                const json = await selectedFile.text()
                updateData(JSON.parse(json))
                setConfigLoaded(true)

            } catch (error) {
                Bus.emit('notification', {
                    title: "Fehler beim Lesen der Datei",
                    message: `Folgender Fehler ist aufgetreten: ${error}`,
                    categoryName: "error"
                })
                setIsValidFile(false)
                setConfigLoaded(false)

            }
        } else {
            setIsValidFile(false)
            setConfigLoaded(false)
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
        <div className={"space-y-8"}>
            <div className={"text-center space-y-4"}>
                <div className={"w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4"}>
                    <Rocket className={"w-8 h-8 text-indigo-500"} />
                </div>
                <h1 className={"text-xl font-bold text-indigo-500"}>
                    Ersteinrichtung
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
                    Laden Sie optional eine vorbereitete Setup-Konfigurationsdatei hoch (z. B. cortex-ui-config.json).
                    Wenn keine Datei hochgeladen wird, können Sie das Setup auch manuell durchlaufen.
                </p>
                <p className="text-red-600 max-w-2xl mx-auto text-xs leading-relaxed">
                    <strong>Hinweis:</strong> Wenn Sie eine Konfigurationsdatei hochladen, werden <u>keine automatischen Tests</u> der Verbindungen durchgeführt.
                    Bitte prüfen Sie daher sorgfältig, ob alle Angaben korrekt und erreichbar sind.
                </p>
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
                        accept={".json"}
                        onChange={handleFileInputChange}
                        className={"absolute inset-0 w-full h-full opacity-0 cursor-pointer"}
                    />

                    <div className={"space-y-4"}>
                        <div className={"flex justify-center"}>
                            <Upload className="w-12 h-12 text-slate-900" />
                        </div>
                        <div>
                            <p className={"text-lg font-medium text-slate-900"}>
                                Datei hierher ziehen oder klicken, um eine Setup-Konfigurationsdatei hochzuladen
                            </p>
                            <p className={"text-sm text-gray-500 mt-2"}>
                                Unterstützte Formate: JSON (max. 2MB)
                            </p>
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
                                    ) : isValidFile === false ? (
                                        <AlertTriangle className={"w-5 h-5 text-red-600"} />
                                    ) : (
                                        <FileText className={"w-5 h-5 text-gray-600"} />
                                    )}
                                </div>
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
            </div>

            <div className={"flex justify-center"}>
                {configLoaded ? (
                    <Button
                        onClick={onSkip}
                        size={"lg"}
                        className={"px-8"}
                    >
                        Zur Zusammenfassung
                    </Button>
                ) : (
                    <Button
                        onClick={onNext}
                        size={"lg"}
                        className={"px-8"}
                        disabled={file ? isValidFile === false : false}
                    >
                        Setup starten
                    </Button>
                )}
            </div>
        </div>
    );
};