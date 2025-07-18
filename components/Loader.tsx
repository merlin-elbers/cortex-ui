import Image from "next/image";
import CortexUI from "@/assets/CortexUI.png";
import React from "react";

const Loader = () => {
    return (
        <div className={"w-dvw h-dvh fixed top-0 left-0 flex items-center justify-center flex-col gap-2 bg-white"}>
            <Image src={CortexUI} alt={"CortexUI"} className={"h-12 w-auto mx-auto mb-4"} />
            <div className={"loader"}>
                <div className={"child"}></div>
            </div>
            <div className={"text"}></div>
        </div>
    )
}

export default Loader;