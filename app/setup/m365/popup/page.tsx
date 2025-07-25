import React, { Suspense } from 'react';
import M365Popup from "@/app/setup/m365/popup/M365Popup";

export default function Page() {
    return (
        <Suspense fallback={<p className="p-4 text-center text-sm">Lade Microsoft Login...</p>}>
            <M365Popup />
        </Suspense>
    );
}