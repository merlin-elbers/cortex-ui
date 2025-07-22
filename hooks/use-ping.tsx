import { useEffect, useState } from "react";

export function usePing(retryInterval = 10000) {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [lastChecked, setLastChecked] = useState<Date>(new Date());
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const checkConnection = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/ping`);
            if (res.ok) {
                setIsOnline(true);
                setErrorMessage(null);
            } else {
                setIsOnline(false);
                setErrorMessage("Server nicht erreichbar. Versuche erneut in 10 Sekunden.");
            }
        } catch {
            setIsOnline(false);
            setErrorMessage("Verbindung zum API Server fehlgeschlagen. Versuche erneut in 10 Sekunden.");
        } finally {
            setLastChecked(new Date());
        }
    };

    useEffect(() => {
        checkConnection();

        const interval = setInterval(() => {
            checkConnection();
        }, retryInterval);

        return () => clearInterval(interval);
    }, [retryInterval]);

    return { isOnline, lastChecked, errorMessage, retryNow: checkConnection };
}