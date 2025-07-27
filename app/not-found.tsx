'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    Terminal,
    Eye,
    ArrowLeft
} from "lucide-react";
import Image from "next/image";
import CortexUI from "@/assets/CortexUI.png"
import {redirect} from "next/navigation";
import {useAuth} from "@/context/AuthContext";

const CortexNotFound = () => {
    const { user } = useAuth()
    const [terminalText, setTerminalText] = useState("");
    const [showCursor, setShowCursor] = useState(true);

    useEffect(() => {
        const text = "cortexui --scan-route not_found --status=404";
        let index = 0;

        const typeWriter = setInterval(() => {
            if (index < text.length) {
                setTerminalText(text.slice(0, index + 1));
                index++;
            } else {
                clearInterval(typeWriter);
            }
        }, 50);

        const cursorBlink = setInterval(() => {
            setShowCursor((prev) => !prev);
        }, 500);

        return () => {
            clearInterval(typeWriter);
            clearInterval(cursorBlink);
        };
    }, []);

    const errorMessages = [
        "Diese Seite existiert (noch) nicht im Hauptzeitstrahl.",
        "CortexUI konnte die Route nicht auflösen.",
        "Modul wurde ins Multiversum verschoben.",
        "Quantenverbindung zum Server unterbrochen."
    ];

    const [currentMessage, setCurrentMessage] = useState(0);

    useEffect(() => {
        const messageRotation = setInterval(() => {
            setCurrentMessage((prev) => (prev + 1) % errorMessages.length);
        }, 4000);

        return () => clearInterval(messageRotation);
    }, [errorMessages.length]);

    return (
        <div className={"min-h-screen bg-slate-50 relative overflow-hidden"}>
            <div className={"absolute inset-0"}>
                <div className={"absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl float-animation"} />
                <div
                    className={"absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl float-animation"}
                    style={{ animationDelay: "1s" }}
                />
                <div
                    className={"absolute top-1/2 left-1/2 w-32 h-32 bg-lime-500/10 rounded-full blur-2xl float-animation"}
                    style={{ animationDelay: "2s" }}
                />
            </div>

            <div className={"relative z-10 min-h-screen flex items-center justify-center p-6"}>
                <div className={"max-w-4xl w-full text-center space-y-8"}>
                    <Image src={CortexUI} alt={"CortexUI"} width={500} height={500} className={"w-fit h-16 mx-auto"}/>

                    <div className={"relative inline-block mb-8"}>
                        <div className={"w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 backdrop-blur-md rounded-full flex items-center justify-center"}>
                            <Eye className={"w-10 h-10 text-indigo-600 float-animation"} />
                        </div>
                        <div className={"absolute inset-0 rounded-full overflow-hidden"}>
                            <div className={"absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent scan-animation"} />
                        </div>
                    </div>

                    <div className={"relative"}>
                        <h1 className={"text-[12rem] md:text-[16rem] font-black text-transparent bg-indigo-500 bg-clip-text leading-none animate-glow-pulse"}>
                            404
                        </h1>
                    </div>

                    <div className={"relative max-w-2xl mx-auto"}>
                        <div className={"bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 backdrop-blur-md rounded-2xl border border-slate-50 shadow-sm p-8"}>
                            <div className={"flex items-center justify-center gap-3 mb-4"}>
                                <AlertTriangle className={"w-6 h-6 text-indigo-500"} />
                                <h2 className={"text-2xl font-bold text-slate-900"}>System Error</h2>
                            </div>

                            <p className={"text-lg text-gray-500 mb-6 transition-all duration-500"}>
                                {errorMessages[currentMessage]}
                            </p>

                            <div className={"flex flex-col sm:flex-row gap-4 justify-center"}>
                                <Button
                                    size={"lg"}
                                    onClick={() => redirect('/')}
                                >
                                    <ArrowLeft className={"w-4 h-4 mr-2"} />
                                    Zum Dashboard
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className={"max-w-xl mx-auto"}>
                        <div className={"bg-slate-900 backdrop-blur-sm rounded-lg border border-indigo-500 p-4 font-mono text-sm"}>
                            <div className={"flex items-center gap-2 mb-2"}>
                                <Terminal className={"w-4 h-4 text-indigo-500"} />
                                <span className={"text-indigo-500"}>
                                    CortexUITerminal v1.0
                                </span>
                            </div>
                            <div className={"text-green-400"}>
                                <span className={"text-neon-green"}>
                                    {user && user.firstName}@cortexui:~$
                                </span>
                                {terminalText}
                                {showCursor &&
                                    <span className={"animate-blink"}>
                                        _
                                    </span>
                                }
                            </div>
                            <div className={"text-red-400 mt-1"}>
                                ERROR: Route resolution failed
                            </div>
                            <div className={"text-yellow-400"}>
                                INFO: Initiating multiverse search protocol...
                            </div>
                        </div>
                    </div>

                    <div className={"mt-16 text-gray-500 text-sm"}>
                        <p>
                            Keine Sorge, selbst die besten Cortex-Module verlaufen sich manchmal im Cyberspace.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CortexNotFound;
