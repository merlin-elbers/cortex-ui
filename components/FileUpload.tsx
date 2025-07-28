import React, {JSX, useEffect, useRef, useState} from "react";
import Bus from "@/lib/bus";
import {AlertTriangle, CheckCircle, X} from "lucide-react";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";

interface FileUploadProps {
    isValidFunction: (file: File) => void;
    allowedExtensions: string[];
    maxFileSize: number;
    icon: JSX.Element;
    resetFile?: boolean;
    onFileReset?: (flag: boolean) => void;
}

export default function FileUpload({ isValidFunction, allowedExtensions, maxFileSize, icon, resetFile, onFileReset }: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [fileData, setFileData] = useState<string| null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isValidFile, setIsValidFile] = useState<boolean | null>(null);
    const maxFileSizeCalculated = maxFileSize * 1024 * 1024;

    useEffect(() => {
        if (resetFile && onFileReset) {
            setFile(null);
            setFileData(null);
            setIsValidFile(null)
            onFileReset(false)
        }
    }, [resetFile, onFileReset]);

    const handleFileSelect = async (selectedFile: File) => {
        const result = await validateFile(selectedFile)
        if (result) {

            try {
                setFile(selectedFile)
                setIsValidFile(true)
                isValidFunction(selectedFile)
                if (selectedFile.type.toLowerCase().includes('image')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        setFileData(e.target?.result as string)
                    };
                    reader.readAsDataURL(selectedFile);
                }
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
                message: `Bitte prüfen Sie, ob Ihre Datei im richtigen Format (${allowedExtensions.map(extension => `${extension}`)}) und maximal ${maxFileSize}MB groß ist.`,
                categoryName: "error"
            })
            setIsValidFile(false)
        }
    };

    const validateFile = async (file: File) => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        return allowedExtensions.includes(extension) && file.size <= maxFileSizeCalculated
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0])
                .then(() => console.log('file uploaded'))
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
            handleFileSelect(files[0])
                .then(() => console.log('file uploaded'))
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
        <>
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
                            {icon}
                        </div>
                        <div>
                            <p className={"text-lg font-medium text-slate-900"}>
                                Datei hierher ziehen oder klicken, um eine Datei hochzuladen
                            </p>
                            <p className={"text-sm text-gray-500 mt-2"}>
                                Unterstützte Formate: {allowedExtensions.map(extension => `${extension} `)} (max. {maxFileSize}MB)
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
                            {fileData &&
                                <Image
                                    src={fileData}
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
        </>
    )
}