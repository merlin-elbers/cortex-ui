import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export async function POST(req: NextRequest) {
    try {
        const { uri, dbName } = await req.json()

        if (!uri || !dbName) {
            return NextResponse.json({
                isOk: false,
                message: 'URI oder DB-Name fehlt.',
            }, {
                status: 400
            })
        }

        const client = new MongoClient(uri, {
            connectTimeoutMS: 5000,
            serverSelectionTimeoutMS: 5000
        })
        await client.connect()
        const db = client.db(dbName)

        await db.listCollections().toArray()
        await client.close()

        return NextResponse.json({
            isOk: true,
            message: 'Verbindung erfolgreich aufgebaut.',
        }, {
            status: 200
        })

    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({
                isOk: false,
                message: `Verbindung fehlgeschlagen: ${error.message}`,
            }, {
                status: 500
            });
        }

        return NextResponse.json({
            isOk: false,
            message: `Unbekannter Fehler bei Verbindungsprüfung.`,
        }, { status: 500 });
    }
}