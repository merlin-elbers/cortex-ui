"use client";

import {useEffect} from "react";
import {useSearchParams} from "next/navigation";

export default function M365Popup() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const m365_config = {
            tenantId: searchParams.get("tenantId"),
            clientId: searchParams.get("clientId"),
            clientSecret: searchParams.get("clientSecret"),
        }
        const redirectUri = `${window.location.origin}/setup/m365/popup`;
        const code = searchParams.get("code");

        if (!code && m365_config.tenantId && m365_config.clientId) {
            sessionStorage.setItem("m365_config", JSON.stringify(m365_config))
            window.location.href = `https://login.microsoftonline.com/${m365_config.tenantId}/oauth2/v2.0/authorize?` +
                `client_id=${m365_config.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&response_mode=query&scope=offline_access User.Read Mail.Send`
            return;
        }
        const configRaw = sessionStorage.getItem("m365_config");
        if (!code || !configRaw) return window.close();

        const config = JSON.parse(configRaw);
        const { tenantId, clientId, clientSecret } = config;

        if (code && tenantId && clientId && clientSecret) {
            const fetchToken = async () => {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URI}/api/v1/settings/m365`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            code,
                            tenantId,
                            clientId,
                            clientSecret,
                            redirect_uri: redirectUri
                        })
                    });

                    const result = await res.json();
                    if (res.ok) {
                        window.opener?.postMessage({
                            ...result
                        }, window.location.origin);
                    } else {
                        window.opener?.postMessage({
                            ...result
                        }, window.location.origin);
                    }
                } catch {
                    window.opener?.postMessage({
                        type: "m365_token_error",
                        message: "Serverfehler beim Token-Austausch"
                    }, window.location.origin);
                } finally {
                    window.close();
                }
            };

            fetchToken();
        }
    }, [searchParams]);

    return (
        <p className="p-4 text-center text-sm">
            Verarbeite Microsoft-Login...
        </p>
    );
}