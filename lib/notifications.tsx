'use client'

import {useEffect, useState} from "react";
import Bus from "@/lib/bus";
import {CircleCheck, CircleX, Info, TriangleAlert, X} from "lucide-react";

interface NotificationProps {
    title: string
    message: string
    categoryName: string
}

export default function Notifications() {
    const [visible, setVisible] = useState<boolean>(false)
    const [title, setTitle] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null);
    const [category, setCategory] = useState<string>("standard");
    const [toggleAnimation, setToggleAnimation] = useState<boolean>(false)


    useEffect(() => {
        const handleNotification = ({ title, message, categoryName }: NotificationProps) => {
            setVisible(true);
            setMessage(message)
            setCategory(categoryName)
            setTitle(title)
            setTimeout(() => {
                setToggleAnimation(true)
                setTimeout(() => {
                    setVisible(false)
                    setToggleAnimation(false)
                }, 500)
            }, 4500)
        }
        Bus.on('notification', handleNotification)
        return () => {
            Bus.off('notification', handleNotification)
        }
    }, [])
    return (
        visible && (
            <div className={"flex max-w-[420px] w-96 p-4 gap-2 flex-col-reverse z-[105] top-0 right-0 fixed group"}>
                <div className={`select-none transition-all enter ${toggleAnimation ? 'leave' : ''} gap-2 backdrop-blur-sm shadow-lg pr-7 p-4 border rounded-lg overflow-hidden items-center flex w-full relative 
                ${category === 'info' ? 'bg-blue-500/20 border-blue-300 text-blue-900' : 
                    category === 'success' ? 'bg-lime-500/20 border-lime-300 text-green-900' : 
                        category === 'warning' ? 'bg-orange-500/20 border-orange-300 text-orange-900' :
                            category === 'error' ? 'bg-red-500/40 border-red-400 text-red-900' : 
                                'bg-white/40 border-gray-200 text-gray-800'}`}
                >
                    {category !== "standard" && (
                        <div className={"shrink-0 mr-2 self-start"}>
                            {category === "info" ?
                                <Info className={"w-5 h-5"} /> :
                                category === "warning" ?
                                    <TriangleAlert className={"w-5 h-5"} /> :
                                    category === "error" ?
                                        <CircleX className={"w-5 h-5"} /> :
                                            <CircleCheck className={"w-5 h-5"} />
                            }
                        </div>
                    )}
                    <div className={`flex gap-2 items-start flex-col`}>
                        <span className={`font-semibold text-sm`}>
                            {title}
                        </span>
                        <span className={`text-sm opacity-90`}>
                            {message}
                        </span>
                    </div>
                    <button
                        className={"opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md absolute top-1 right-1 cursor-pointer"}
                        onClick={() => setVisible(!visible)}
                    >
                        <X className={`${category === "standard" ? "text-gray-600 hover:text-black" : "text-gray-600 hover:text-black"} transition-colors h-4 w-4`} />
                    </button>
                </div>
            </div>
        )
    )
}