import Image from "next/image";
import CortexUI from "@/assets/CortexUI.png";
import React from "react";
import {cn} from "@/lib/utils";

interface LoaderProps {
    className?: string;
}

const Loader = ({ className }: LoaderProps) => {
    return (
        <div className={cn("w-dvw h-dvh fixed top-0 left-0 flex items-center justify-center flex-col gap-2 bg-white z-[101]", className)}>
            <Image src={CortexUI} alt={"CortexUI"} className={"h-12 w-auto mx-auto mb-4"} priority={true} />
            <div className={"loader"}>
                <div className={"child"}></div>
            </div>
            <div className={"text"}></div>
        </div>
    )
}

export default Loader;