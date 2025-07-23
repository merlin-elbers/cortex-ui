import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            host,
            port,
            user,
            pass,
            from,
            fromName,
            to = "example@example.com",
        } = body

        if (!host || !port || !user || !pass) {
            return NextResponse.json({
                isOk: false,
                status: "MISSING_FIELDS",
                message: "SMTP-Daten unvollständig.",
            }, {
                status: 400
            })
        }

        const transporter = nodemailer.createTransport({
            host,
            port: parseInt(port),
            secure: parseInt(port) === 465,
            auth: { user, pass },
        });

        await transporter.sendMail({
            from: `${fromName || "CortexUI"} <${from || user}>`,
            to,
            subject: "CortexUI | SMTP Testnachricht",
            text: "✅ Die SMTP-Verbindung war erfolgreich.",
        });

        return NextResponse.json({
            isOk: true,
            status: "OK",
            message: "Test-E-Mail erfolgreich gesendet.",
        }, {
            status: 200
        })
    } catch (error: unknown) {
        return NextResponse.json({
            isOk: false,
            status: "SMTP_ERROR",
            message: `SMTP-Verbindung fehlgeschlagen. ${(error as Error).message}`
        }, {
            status: 500
        })
    }
}