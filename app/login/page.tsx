'use client'

import React, {useEffect, useState} from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';
import {redirect} from "next/navigation";
import Link from "next/link";
import {useAuth} from "@/context/AuthContext";
import Image from "next/image";
import CortexSmall from "@/assets/CortexUI_small.png"
import CortexUI from "@/assets/CortexUI.png"
import Loader from "@/components/Loader";
import Bus from "@/lib/bus";
import {usePing} from "@/hooks/use-ping";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const { isOnline, errorMessage, lastChecked } = usePing();
    const { isAuthenticated, loading, login, setupCompleted, whiteLabelConfig } = useAuth()

    useEffect(() => {
        if (isOnline === false && lastChecked < new Date()) {
            Bus.emit("notification", {
                title: "Verbindung fehlgeschlagen",
                message: errorMessage,
                categoryName: "warning"
            });
        }
    }, [errorMessage, isOnline, lastChecked]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        login(email, password)
            .then(res => {
                setTimeout(() => {
                    setIsLoading(false)
                }, 1000)
                if (res) {
                    setTimeout(() => {
                        redirect('/')
                    }, 1000)
                }
            })

        setTimeout(() => {
            setIsLoading(false)
        }, 1500);
    }

    if (loading) return <Loader />

    if (!setupCompleted) {
        redirect("/setup");
    }

    return !isAuthenticated ? (
        <div
            className={"min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex items-center justify-center p-4 relative"}>
            <div className={"w-full max-w-md"}>
                <div className={"text-center mb-8"}>
                    <div className={"text-center mb-8"}>
                        {!whiteLabelConfig.logo?.data ? (
                            <>
                                <Link href={"https://github.com/merlin-elbers/cortex-ui"} target={"_blank"}>
                                    <Image src={CortexUI} alt={"CortexUI"} className={"h-12 w-auto mx-auto mb-4"} />
                                </Link>
                                <p className={"text-gray-500"}>
                                    Melden Sie sich an, um Ihre Website zu verwalten
                                </p>
                            </>
                        ) : (
                            <div className={"mb-4 bg-slate-50/50 backdrop-blur-sm border border-slate-200 rounded-lg p-2 flex flex-col gap-2"}>
                                <Link
                                    href={"https://github.com/merlin-elbers/cortex-ui"}
                                    className={"flex gap-2 items-center justify-center"}
                                >
                                    <Image
                                        src={whiteLabelConfig.logo.data}
                                        width={500}
                                        height={500}
                                        alt={whiteLabelConfig.logo.name ?? 'Logo'}
                                        className={"h-12 w-auto"}
                                    />
                                    <h1 className={"text-slate-900 text-2xl"}>
                                        {whiteLabelConfig.title}
                                    </h1>
                                </Link>
                                <p className={"text-gray-500"}>
                                    Melden Sie sich an, um Ihre Website zu verwalten
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={"bg-slate-50/50 backdrop-blur-sm border border-slate-200 rounded-lg p-8 shadow-2xl"}>
                    <form onSubmit={handleLogin} className={"space-y-6"}>

                        <div className={"space-y-2"}>
                            <label htmlFor={"email"} className={"block text-sm font-medium text-slate-900"}>
                                E-Mail
                            </label>
                            <div className={"relative"}>
                                <div className={"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"}>
                                    <User className={"h-5 w-5 text-gray-500"} />
                                </div>
                                <input
                                    id={"email"}
                                    type={"email"}
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={"w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-md text-slate-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}
                                    placeholder={"admin@cortex.ui"}
                                />
                            </div>
                        </div>

                        <div className={"space-y-2"}>
                            <label htmlFor={"password"} className={"block text-sm font-medium text-slate-900"}>
                                Passwort
                            </label>
                            <div className={"relative"}>
                                <div className={"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"}>
                                    <Lock className={"h-5 w-5 text-gray-500"} />
                                </div>
                                <input
                                    id={"password"}
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={"w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-md text-slate-900 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"}
                                    placeholder={"••••••••"}
                                />
                                <button
                                    type={"button"}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={"absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-500 cursor-pointer transition-colors"}
                                >
                                    {showPassword ? (
                                        <EyeOff className={"h-5 w-5"} />
                                    ) : (
                                        <Eye className={"h-5 w-5"} />
                                    )}
                                </button>
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
                                        Anmeldung...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span>
                                        Anmelden
                                    </span>
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className={"mt-6 text-center"}>
                        <Link
                            href={process.env.NEXT_PUBLIC_WEBSITE_URI as string}
                            className={"text-indigo-400 hover:text-indigo-500 text-sm transition-colors"}
                        >
                            ← Zurück zur Website
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
    ) : redirect('/')
};

export default Login;