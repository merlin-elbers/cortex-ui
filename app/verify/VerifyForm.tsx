'use client'

import React, {useEffect, useState} from 'react';
import {ArrowRight, KeyRound} from 'lucide-react';
import {redirect, useSearchParams} from "next/navigation";
import Link from "next/link";
import {useAuth} from "@/context/AuthContext";
import Image from "next/image";
import CortexSmall from "@/assets/CortexUI_small.png"
import CortexUI from "@/assets/CortexUI.png"
import Loader from "@/components/Loader";
import Bus from "@/lib/bus";
import {usePing} from "@/hooks/use-ping";

const VerifyForm = () => {
    const searchParams = useSearchParams()

    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { isOnline, errorMessage, lastChecked } = usePing();
    const { setupCompleted, whiteLabelConfig, loading, isAuthenticated } = useAuth()


    useEffect(() => {
        if (isOnline === false && lastChecked < new Date()) {
            Bus.emit("notification", {
                title: "Verbindung fehlgeschlagen",
                message: errorMessage,
                categoryName: "warning"
            });
        }
    }, [errorMessage, isOnline, lastChecked]);

    useEffect(() => {
        if (searchParams.has('code')) {
            const urlCode = searchParams.get("code")
            fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/auth/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ code: urlCode }),
            })
                .then(res => res.json())
                .then(json => {
                    if (json.isOk) {
                        Bus.emit("notification", {
                            title: "E-Mail verifiziert",
                            message: "Ihre E-Mail Adresse wurde erfolgreich verifizert",
                            categoryName: "success"
                        })
                        redirect('/login')
                    }
                    Bus.emit("notification", {
                        title: "E-Mail konnte nicht verifiziert werden",
                        message: `Ihre E-Mail Adresse konnte nicht verifizert werden, folgender Fehler ist aufgetreten: ${json.message}`,
                        categoryName: "warning"
                    })
                })
                .finally(() => setIsLoading(false))
        }
    }, [searchParams])

    if (loading) return <Loader />

    if (!setupCompleted) return redirect("/setup");
    if (isAuthenticated) return redirect("/");

    const handleSubmit = async () => {
        if (isLoading) return
        setIsLoading(true)
        fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/auth/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ code: code }),
        })
            .then(res => res.json())
            .then(json => {
                if (json.isOk) {
                    Bus.emit("notification", {
                        title: "E-Mail verifiziert",
                        message: "Ihre E-Mail Adresse wurde erfolgreich verifizert",
                        categoryName: "success"
                    })
                    redirect('/login')
                }
                Bus.emit("notification", {
                    title: "E-Mail konnte nicht verifiziert werden",
                    message: `Ihre E-Mail Adresse konnte nicht verifizert werden, folgender Fehler ist aufgetreten: ${json.message}`,
                    categoryName: "success"
                })
            })
            .finally(() => setIsLoading(false))
    }

    return (
        <div
            className={"min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex items-center justify-center p-4 relative"}>
            <div className={"w-full max-w-md"}>
                <div className={"text-center mb-8"}>
                    {!whiteLabelConfig.logo?.data ? (
                        <>
                            <Link href={"https://github.com/merlin-elbers/cortex-ui"} target={"_blank"}>
                                <Image src={CortexUI} alt={"CortexUI"} className={"h-12 w-auto mx-auto mb-4"} />
                            </Link>
                            <p className={"text-gray-500"}>
                                Bestätigen Sie ihre E-Mail Adresse, um auf das CortexUI Admin Dashboard zuzugreifen
                            </p>
                        </>
                    ) : (
                        <div className={"space-y-4"}>
                            <Link
                                href={"https://github.com/merlin-elbers/cortex-ui"}
                                className={"flex gap-4 items-end justify-center"}
                            >
                                <Image
                                    src={whiteLabelConfig.logo.data}
                                    width={500}
                                    height={500}
                                    alt={whiteLabelConfig.logo.name ?? 'Logo'}
                                    className={"h-12 w-auto"}
                                />
                                {whiteLabelConfig.showTitle && (
                                    <h1 className={"text-slate-900 text-2xl"}>
                                        {whiteLabelConfig.title}
                                    </h1>
                                )}
                            </Link>
                            <p className={"text-gray-500"}>
                                Bestätigen Sie ihre E-Mail Adresse, um auf das CortexUI Admin Dashboard zuzugreifen
                            </p>
                        </div>
                    )}
                </div>

                <div className={"bg-slate-50/50 backdrop-blur-sm border border-slate-200 rounded-lg p-8 shadow-2xl"}>
                    <form onSubmit={handleSubmit} className={"space-y-6"}>

                        <div className={"space-y-2"}>
                            <label htmlFor={"code"} className={"block text-sm font-medium text-slate-900"}>
                                Verifizierungscode
                            </label>
                            <div className={"relative"}>
                                <div className={"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"}>
                                    <KeyRound className={"h-5 w-5 text-gray-500"} />
                                </div>
                                <input
                                    id={"code"}
                                    type={"text"}
                                    required
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className={"w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-md text-slate-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}
                                    placeholder={"azPSh-iaWC4ukHUdmY__kwZS9lN2ZCrTdPZo80053Mw"}
                                />
                            </div>
                        </div>

                        <button
                            type={"submit"}
                            disabled={isLoading}
                            className={"w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white py-3 px-4 rounded-md font-semibold transition-all duration-300 transform hover:scale-[1.01] cursor-pointer disabled:hover:scale-100 flex items-center justify-center gap-2"}
                        >
                            {isLoading ? (
                                <>
                                    <div className={"animate-spin rounded-full h-5 w-5 border-b-2 border-white"}></div>
                                    <span>
                                        Verifiziere Konto
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span>
                                        Verifizieren
                                    </span>
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className={"mt-6 text-center"}>
                        <Link
                            href={`${process.env.NEXT_PUBLIC_APP_URI}/login`}
                            className={"text-indigo-400 hover:text-indigo-500 text-sm transition-colors"}
                        >
                            ← Zurück zum Login
                        </Link>
                    </div>
                </div>
            </div>
            <Link href={"https://github.com/merlin-elbers/cortex-ui"} target={"_blank"} className={"text-indigo-500 fixed bottom-4 left-0 right-0 mx-auto flex w-fit items-center gap-2 text-sm"}>
                <span>
                    Proudly presented to you by
                </span>
                <Image src={CortexSmall} alt={"CortexUI"} className={"h-6 w-auto"} />
            </Link>
        </div>
    )
};

export default VerifyForm;