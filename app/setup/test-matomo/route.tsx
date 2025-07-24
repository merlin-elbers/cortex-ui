import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const { matomoUrl, matomoSiteId, matomoApiKey } = await req.json();

    if (!matomoUrl || !matomoSiteId || !matomoApiKey) {
        return Response.json({
            isOk: false,
            message: "Fehlende Parameter für den Matomo-Test."
        }, {
            status: 400
        });
    }

    try {
        const res = await fetch(`${matomoUrl}/?module=API&method=SitesManager.getSiteFromId&format=JSON`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                idSite: matomoSiteId,
                token_auth: matomoApiKey,
            }),
        });

        if (!res.ok) {
            return Response.json({
                isOk: false,
                message: "Fehler beim Verbinden zu Matomo"
            }, {
                status: 400
            });
        }

        const data = await res.json();

        if (data?.idsite) {
            return Response.json({
                isOk: true,
                message: "Matomo-Verbindung erfolgreich",
                siteName: data.name,
                timezone: data.timezone,
            });
        } else {
            return Response.json({
                isOk: false,
                message: "Matomo konnte die Seite nicht finden oder API-Key ist ungültig",
                raw: data
            }, {
                status: 400
            });
        }

    } catch (e) {
        return Response.json({
            isOk: false,
            message: `Fehler beim Verbinden zu Matomo ${(e as Error).message}`,
        }, {
            status: 500
        });
    }
}