import { useEffect, useState } from "react";
import Bus from "@/lib/bus";

export function usePing(retryInterval = 10000) {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [lastChecked, setLastChecked] = useState<Date>(new Date());
    const [lastState, setLastState] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/system/ping`);
                if (res.ok) {
                    setIsOnline(true);
                    setErrorMessage(null);

                    if (!lastState) {
                        Bus.emit("notification", {
                            title: "Verbindung wiederhergestellt",
                            message: "Die Verbindung zum Server wurde wiederhergestellt.",
                            categoryName: "success"
                        });
                    }

                    setLastState(true);
                } else {
                    setIsOnline(false);
                    setErrorMessage("Server nicht erreichbar. Versuche erneut in 10 Sekunden.");
                    setLastState(false);
                }
            } catch {
                setIsOnline(false);
                setErrorMessage("Verbindung zum API Server fehlgeschlagen. Versuche erneut in 10 Sekunden.");
                setLastState(false);
            } finally {
                setLastChecked(new Date());
            }
        }

        const interval = setInterval(() => {
            checkConnection();
        }, retryInterval);

        return () => clearInterval(interval);
    }, [lastState, retryInterval]);

    return { isOnline, lastChecked, errorMessage };
}