import React, {FC, useState} from 'react';
import { Button } from '@/components/ui/button';
import {FileText, Rocket} from 'lucide-react';
import {SetupData} from "@/types/SetupData";
import FileUpload from "@/lib/file-upload";

interface FileUploadStepProps {
    onNext: () => void;
    onSkip: () => void;
    updateData: (data: SetupData) => void;
}

export const FileUploadStep: FC<FileUploadStepProps> = ({ onNext, updateData, onSkip }) => {
    const [configLoaded, setConfigLoaded] = useState(false)

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

            <FileUpload
                isValidFunction={async (file: File) => {
                    const json = await file.text()
                    updateData(JSON.parse(json))
                    setConfigLoaded(true)
                }}
                allowedExtensions={['.json']}
                maxFileSize={2}
                icon={<FileText className={"w-14 h-14 text-slate-900"} /> }
            />

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
                    >
                        Setup starten
                    </Button>
                )}
            </div>
        </div>
    );
};